import Flow from "../utils/Flow.ts";
import { resolveLineColor } from "../utils/color.ts";
import initialState, { defaultFitViewOptions } from "./initialState.ts";
import canvasReducer from "./reducer.ts";
import type { CanvasConfigProps, StoreState } from "../types/index.ts";
import type { DAGNode } from "../types/index.ts";
import type { FitViewOptions, Viewport } from "../types/index.ts";

export function createNodeMap(nodes: DAGNode[]): Map<string, DAGNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

export function isNodeSelectable(node: DAGNode | undefined, nodesSelectable: boolean): boolean {
  return node?.selectable ?? nodesSelectable;
}

export function createSelectedNodes(
  nodeMap: Map<string, DAGNode>,
  nodesSelectable: boolean,
): Set<string> {
  return new Set(
    Array.from(nodeMap.values())
      .filter((node) => node.selected && isNodeSelectable(node, nodesSelectable))
      .map((node) => node.id),
  );
}

export function getNodesFromState(state: {
  nodeMap: Map<string, DAGNode>;
  selectedNodes: Set<string>;
}): DAGNode[] {
  return Array.from(state.nodeMap.values(), (node) => {
    const selected = state.selectedNodes.has(node.id);
    if (selected) return node.selected === true ? node : { ...node, selected: true };
    return node.selected === true ? { ...node, selected: false } : node;
  });
}

export function flowsEqual(first: unknown, second: unknown): boolean {
  if (first === second) return true;
  if (!Array.isArray(first) || !Array.isArray(second) || first.length !== second.length)
    return false;
  return first.every((item, index) =>
    Array.isArray(item) || Array.isArray(second[index])
      ? flowsEqual(item, second[index])
      : item === second[index],
  );
}

export function nodeMapsEqual(first: Map<string, DAGNode>, second: Map<string, DAGNode>): boolean {
  if (first === second) return true;
  if (first.size !== second.size) return false;
  const secondEntries = second.entries();
  for (const [id, data] of first) {
    const next = secondEntries.next().value;
    if (!next || next[0] !== id || next[1] !== data) return false;
  }
  return true;
}

export function shallowObjectEqual(first: unknown, second: unknown): boolean {
  if (first === second) return true;
  if (!first || !second || typeof first !== "object" || typeof second !== "object") return false;
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);
  return (
    firstKeys.length === secondKeys.length &&
    firstKeys.every(
      (key) => (first as Record<string, unknown>)[key] === (second as Record<string, unknown>)[key],
    )
  );
}

export function fitViewOptionsEqual(first: unknown, second: unknown): boolean {
  if (first === second) return true;
  if (!first || !second) return false;
  const a = first as FitViewOptions;
  const b = second as FitViewOptions;
  return (
    a.minZoom === b.minZoom &&
    a.maxZoom === b.maxZoom &&
    a.horizontalAlign === b.horizontalAlign &&
    a.verticalAlign === b.verticalAlign &&
    (a.padding === b.padding || shallowObjectEqual(a.padding, b.padding))
  );
}

function resolveDefaultViewport(defaultViewport: Viewport | undefined): Viewport {
  const x = defaultViewport?.x;
  const y = defaultViewport?.y;
  const zoom = defaultViewport?.zoom;
  return {
    x: x !== undefined && Number.isFinite(x) ? x : initialState.defaultViewport.x,
    y: y !== undefined && Number.isFinite(y) ? y : initialState.defaultViewport.y,
    zoom: zoom !== undefined && Number.isFinite(zoom) ? zoom : initialState.defaultViewport.zoom,
  };
}

/** 创建初始状态（props 均为可选，未提供时使用默认值） */
export function createInitialState(props: CanvasConfigProps): StoreState {
  const hGap = props.hGap ?? initialState.layout.hGap;
  const vGap = props.vGap ?? initialState.layout.vGap;
  const lineWidth = props.lineWidth ?? initialState.layout.lineWidth;
  const nodesSelectable = props.nodesSelectable ?? initialState.nodesSelectable;

  const minZoom = props.minZoom ?? initialState.minZoom;
  const maxZoom = props.maxZoom ?? initialState.maxZoom;
  const fitView = !!(props.fitView ?? initialState.fitView);
  const fitViewOptions = {
    ...props.fitViewOptions,
    padding: props.fitViewOptions?.padding ?? defaultFitViewOptions.padding,
    horizontalAlign: props.fitViewOptions?.horizontalAlign ?? defaultFitViewOptions.horizontalAlign,
    verticalAlign: props.fitViewOptions?.verticalAlign ?? defaultFitViewOptions.verticalAlign,
  };
  const zoomOnScroll = !!(props.zoomOnScroll ?? initialState.zoomOnScroll);
  const zoomModifier = props.zoomModifier ?? initialState.zoomModifier;
  // scroll 时不能同时平移和缩放
  const panOnScroll = !zoomOnScroll && !!(props.panOnScroll ?? initialState.panOnScroll);
  const panScrollModifier = props.panScrollModifier ?? initialState.panScrollModifier;
  const panOnDrag = !!(props.panOnDrag ?? initialState.panOnDrag);
  const panDragModifier = props.panDragModifier ?? initialState.panDragModifier;

  const resolvedDefaultViewport = resolveDefaultViewport(props.defaultViewport);
  const defaultViewport = {
    ...resolvedDefaultViewport,
    zoom: Math.max(minZoom, Math.min(maxZoom, resolvedDefaultViewport.zoom)),
  };

  const nodeMap = createNodeMap(props.nodes ?? props.defaultNodes ?? []);
  return {
    ...initialState,
    uid: props.uid ?? "",
    transform: {
      ...initialState.transform,
      zoom: defaultViewport.zoom,
      x: defaultViewport.x,
      y: defaultViewport.y,
    },
    defaultViewport,
    flow: new Flow(props.flow ?? props.defaultFlow ?? initialState.flow).toArray(),
    minZoom,
    maxZoom,
    fitView,
    fitViewOptions,
    zoomOnScroll,
    zoomModifier,
    panOnScroll,
    panScrollModifier,
    panOnDrag,
    panDragModifier,
    nodesSelectable,
    selectedNodes: createSelectedNodes(nodeMap, nodesSelectable),
    layout: {
      ...initialState.layout,
      hGap,
      vGap,
      lineWidth,
      lineColor: resolveLineColor(props.lineColor ?? initialState.layout.lineColor),
    },
    nodeMap,
    nodeTypes: props.nodeTypes ?? initialState.nodeTypes,
    layoutEngine: props.layoutEngine,
  };
}

/** 同步受控 props 到当前状态；仅首次挂载时应用 default* 数据 */
export function syncCanvasProps(
  state: StoreState,
  props: CanvasConfigProps,
  initializeViewport: boolean,
): StoreState {
  let nextState = state;

  const nextOptions = {
    uid: props.uid ?? state.uid,
    defaultViewport: resolveDefaultViewport(props.defaultViewport),
    minZoom: props.minZoom ?? state.minZoom,
    maxZoom: props.maxZoom ?? state.maxZoom,
    fitView: !!(props.fitView ?? state.fitView),
    fitViewOptions: {
      ...(props.fitViewOptions ?? state.fitViewOptions),
      padding: props.fitViewOptions?.padding ?? state.fitViewOptions.padding,
      horizontalAlign:
        props.fitViewOptions?.horizontalAlign ?? state.fitViewOptions.horizontalAlign,
      verticalAlign: props.fitViewOptions?.verticalAlign ?? state.fitViewOptions.verticalAlign,
    },
    zoomOnScroll: !!(props.zoomOnScroll ?? state.zoomOnScroll),
    zoomModifier: props.zoomModifier ?? state.zoomModifier,
    panOnScroll: !!(props.panOnScroll ?? state.panOnScroll),
    panScrollModifier: props.panScrollModifier ?? state.panScrollModifier,
    panOnDrag: !!(props.panOnDrag ?? state.panOnDrag),
    panDragModifier: props.panDragModifier ?? state.panDragModifier,
    nodesSelectable: props.nodesSelectable ?? state.nodesSelectable,
  };

  const optionsChanged = Object.entries(nextOptions).some(([key, value]) => {
    if (key === "defaultViewport") {
      const prev = (state.defaultViewport ?? {}) as unknown as Record<string, unknown>;
      return Object.entries(value).some(
        ([viewportKey, viewportValue]) => prev[viewportKey] !== viewportValue,
      );
    }
    if (key === "fitViewOptions") return !fitViewOptionsEqual(state.fitViewOptions, value);
    return state[key as keyof StoreState] !== value;
  });

  if (optionsChanged) {
    nextState = { ...nextState, ...nextOptions };
  }

  if (initializeViewport) {
    const viewportChanged =
      nextState.transform.x !== nextOptions.defaultViewport.x ||
      nextState.transform.y !== nextOptions.defaultViewport.y ||
      nextState.transform.zoom !== nextOptions.defaultViewport.zoom;
    if (viewportChanged) {
      nextState = {
        ...nextState,
        transform: { ...nextOptions.defaultViewport },
      };
    }
  }

  const nextFlow = props.flow ?? (initializeViewport ? props.defaultFlow : undefined);
  if (nextFlow !== undefined) {
    const normalizedNextFlow = new Flow(nextFlow).toArray();
    if (!flowsEqual(normalizedNextFlow, nextState.flow)) {
      nextState = canvasReducer(nextState, { type: "SET_FLOW", payload: normalizedNextFlow });
    }
  }
  const nextNodes = props.nodes ?? (initializeViewport ? props.defaultNodes : undefined);
  if (nextNodes !== undefined) {
    const nextNodeMap = createNodeMap(nextNodes);
    if (!nodeMapsEqual(nextNodeMap, nextState.nodeMap)) {
      nextState = canvasReducer(nextState, { type: "SET_NODE_MAP", payload: nextNodeMap });
    }
  }

  const selectedNodes = new Set(
    Array.from(nextState.selectedNodes).filter((id) =>
      isNodeSelectable(nextState.nodeMap.get(id), nextState.nodesSelectable),
    ),
  );
  if (selectedNodes.size !== nextState.selectedNodes.size)
    nextState = { ...nextState, selectedNodes };

  if (props.layoutEngine && props.layoutEngine !== nextState.layoutEngine) {
    nextState = { ...nextState, layoutEngine: props.layoutEngine };
  }

  return nextState;
}
