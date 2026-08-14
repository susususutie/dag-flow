import Flow from "../utils/Flow.ts";
import type { CanvasAction, StoreState, StoreStateSnapshot } from "../types/index.ts";

const HISTORY_LIMIT = 50;

/** 当前拓扑/选中集快照（供撤销栈） */
function snapshotOf(state: StoreState): StoreStateSnapshot {
  return {
    flow: state.flow,
    nodeMap: state.nodeMap,
    selectedNodes: state.selectedNodes,
  };
}

function pushSnapshot(
  history: StoreStateSnapshot[],
  snapshot: StoreStateSnapshot,
): StoreStateSnapshot[] {
  const last = history[history.length - 1];
  if (last && last.flow === snapshot.flow && last.nodeMap === snapshot.nodeMap) return history;
  return [...history, snapshot].slice(-HISTORY_LIMIT);
}

function reconcileNodeDimensions(
  previousNodeMap: StoreState["nodeMap"],
  nextNodeMap: StoreState["nodeMap"],
  dimensions: StoreState["nodeDimensions"],
): StoreState["nodeDimensions"] {
  const nextDimensions = new Map<string, { width: number; height: number }>();
  nextNodeMap.forEach((node, id) => {
    const previousNode = previousNodeMap.get(id);
    const measured = dimensions.get(id);
    if (!previousNode || !measured) return;
    if (previousNode.type !== node.type || previousNode.data !== node.data) return;
    nextDimensions.set(id, measured);
  });
  return nextDimensions;
}

function replaceDAG(
  state: StoreState,
  payload: Extract<CanvasAction, { type: "SET_DAG" }>["payload"],
  source: "edit" | "sync",
): StoreState {
  const flow = payload.flow === state.flow ? state.flow : new Flow(payload.flow).toArray();
  const nodeMap = payload.nodeMap === state.nodeMap ? state.nodeMap : new Map(payload.nodeMap);
  if (flow === state.flow && nodeMap === state.nodeMap) return state;

  const selectedNodes =
    nodeMap === state.nodeMap
      ? state.selectedNodes
      : new Set(
          Array.from(nodeMap.values())
            .filter((node) => node.selected && (node.selectable ?? state.nodesSelectable))
            .map((node) => node.id),
        );
  const nodeDimensions =
    nodeMap === state.nodeMap
      ? state.nodeDimensions
      : reconcileNodeDimensions(state.nodeMap, nodeMap, state.nodeDimensions);
  const layoutReady =
    state.autoLayout && flow !== state.flow && nodeMap.size > 0 ? false : state.layoutReady;

  if (source === "sync") {
    return {
      ...state,
      dirty: false,
      flow,
      nodeMap,
      nodeDimensions,
      layoutReady,
      selectedNodes,
      history: [],
      future: [],
    };
  }

  return {
    ...state,
    dirty: true,
    flow,
    nodeMap,
    nodeDimensions,
    layoutReady,
    selectedNodes,
    history: pushSnapshot(state.history, snapshotOf(state)),
    future: [],
  };
}

export default function canvasReducer(state: StoreState, action: CanvasAction): StoreState {
  switch (action.type) {
    case "BATCH": {
      return action.payload.reduce(canvasReducer, state);
    }
    case "SET_TRANSFORM": {
      return { ...state, transform: { ...state.transform, ...action.payload } };
    }
    case "ZOOM": {
      const { delta, mouseX, mouseY } = action.payload;
      const { x, y, zoom } = state.transform;
      const newZoom = Math.max(state.minZoom, Math.min(state.maxZoom, zoom * (1 + delta)));
      const canvasX = (mouseX - x) / zoom;
      const canvasY = (mouseY - y) / zoom;
      const newX = mouseX - canvasX * newZoom;
      const newY = mouseY - canvasY * newZoom;
      if (newZoom === zoom && newX === x && newY === y) return state;
      return { ...state, transform: { x: newX, y: newY, zoom: newZoom } };
    }
    case "ZOOM_TO": {
      // 缩放到指定比例或按因子缩放，围绕锚点 (centerX, centerY) 保持内容点不动
      const { zoom: targetZoom, factor, centerX, centerY } = action.payload;
      const { x, y, zoom } = state.transform;
      const nextZoom = targetZoom !== undefined ? targetZoom : zoom * (factor ?? 1);
      const newZoom = Math.max(state.minZoom, Math.min(state.maxZoom, nextZoom));
      if (newZoom === zoom) return state;
      const canvasX = (centerX - x) / zoom;
      const canvasY = (centerY - y) / zoom;
      return {
        ...state,
        transform: {
          x: centerX - canvasX * newZoom,
          y: centerY - canvasY * newZoom,
          zoom: newZoom,
        },
      };
    }
    case "PAN_BY": {
      const { dx, dy } = action.payload;
      return {
        ...state,
        transform: { ...state.transform, x: state.transform.x + dx, y: state.transform.y + dy },
      };
    }
    case "PAN": {
      const { x, y } = action.payload;
      return { ...state, transform: { ...state.transform, x, y } };
    }
    case "SET_FLOW": {
      const flow = new Flow(action.payload).toArray();
      if (flow === state.flow) return state;
      return {
        ...state,
        dirty: true,
        flow,
        layoutReady: !state.autoLayout || state.nodeMap.size === 0,
        history: pushSnapshot(state.history, snapshotOf(state)),
        future: [],
      };
    }
    case "SET_NODE_MAP": {
      return replaceDAG(state, { flow: state.flow, nodeMap: action.payload }, "edit");
    }
    case "APPLY_LAYOUT": {
      let nodeMap = state.nodeMap;
      action.payload.forEach((position, id) => {
        const node = state.nodeMap.get(id);
        if (!node) return;
        if (node.position?.x === position.x && node.position?.y === position.y) return;
        if (nodeMap === state.nodeMap) nodeMap = new Map(state.nodeMap);
        nodeMap.set(id, { ...node, position: { ...position } });
      });
      if (nodeMap === state.nodeMap && state.layoutReady) return state;
      return { ...state, nodeMap, layoutReady: true };
    }
    case "SET_DAG": {
      return replaceDAG(state, action.payload, "edit");
    }
    case "SYNC_DAG": {
      return replaceDAG(state, action.payload, "sync");
    }
    case "DELETE_NODE": {
      const { ids } = action.payload;
      const list = Array.isArray(ids) ? ids : [ids];
      const nodeMap = new Map(state.nodeMap);
      const flow = new Flow(state.flow);
      const nodeDimensions = new Map(state.nodeDimensions);
      const selectedNodes = new Set(state.selectedNodes);
      const existingIds = list.filter((id) => nodeMap.has(id) || flow.hasNode(id));
      if (existingIds.length === 0) return state;

      existingIds.forEach((id) => {
        nodeMap.delete(id);
        flow.remove(id);
        nodeDimensions.delete(id);
        selectedNodes.delete(id);
      });
      return {
        ...state,
        dirty: true,
        flow: flow.toArray(),
        nodeMap,
        nodeDimensions,
        selectedNodes,
        layoutReady: !state.autoLayout || nodeMap.size === 0,
        history: pushSnapshot(state.history, snapshotOf(state)),
        future: [],
      };
    }
    case "SET_NODE_DIMENSIONS": {
      const updates = action.payload;
      if (updates.size === 0) return state;
      const nodeDimensions = new Map(state.nodeDimensions);
      let hasChange = false;
      for (const [id, dims] of updates) {
        const old = nodeDimensions.get(id);
        if (
          (dims.width === 0 && dims.height === 0) ||
          (old && old.width === dims.width && old.height === dims.height)
        ) {
          continue;
        }
        nodeDimensions.set(id, { width: dims.width, height: dims.height });
        hasChange = true;
      }
      if (!hasChange) return state;
      return { ...state, nodeDimensions };
    }
    case "UPDATE_NODE_POSITION": {
      const { id, position, dragging, origin } = action.payload;
      const node = state.nodeMap.get(id);
      if (!node) return state;

      const positionChanged = node.position?.x !== position.x || node.position?.y !== position.y;
      const dragFinished =
        dragging === false &&
        origin !== undefined &&
        (origin.x !== position.x || origin.y !== position.y);
      if (!positionChanged && !dragFinished) return state;

      const nodeMap = positionChanged ? new Map(state.nodeMap) : state.nodeMap;
      if (positionChanged) {
        nodeMap.set(id, { ...node, position: { x: position.x, y: position.y } });
      }

      if (!dragFinished) return { ...state, dirty: true, nodeMap };

      const previousNodeMap = new Map(nodeMap);
      previousNodeMap.set(id, { ...node, position: origin });
      return {
        ...state,
        dirty: true,
        nodeMap,
        history: pushSnapshot(state.history, {
          flow: state.flow,
          nodeMap: previousNodeMap,
          selectedNodes: state.selectedNodes,
        }),
        future: [],
      };
    }
    case "UPDATE_CONNECTING": {
      const { edge } = action.payload;
      if (edge === state.connectingEdge) return state;
      return { ...state, connectingEdge: edge };
    }
    case "UPDATE_SELECTED_NODE": {
      const { id } = action.payload;

      const flow = new Flow(state.flow);
      if (!flow.hasNode(id)) return state;

      // 单选语义：点击未选中节点时仅选中它；已选中节点保持选中。
      if (state.selectedNodes.size === 1 && state.selectedNodes.has(id)) return state;
      const selectedNodes = new Set<string>();
      selectedNodes.add(id);
      return { ...state, selectedNodes };
    }
    case "CLEAR_SELECTION": {
      if (state.selectedNodes.size === 0) return state;
      return { ...state, selectedNodes: new Set() };
    }
    case "UNDO": {
      if (state.history.length === 0) return state;
      const entry = state.history[state.history.length - 1];
      const history = state.history.slice(0, -1);
      const future = [snapshotOf(state), ...state.future].slice(0, HISTORY_LIMIT);
      return {
        ...state,
        dirty: true,
        history,
        future,
        flow: entry.flow,
        nodeMap: entry.nodeMap,
        nodeDimensions: reconcileNodeDimensions(state.nodeMap, entry.nodeMap, state.nodeDimensions),
        selectedNodes: entry.selectedNodes,
        layoutReady: !state.autoLayout || entry.nodeMap.size === 0,
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const entry = state.future[0];
      const future = state.future.slice(1);
      const history = pushSnapshot(state.history, snapshotOf(state));
      return {
        ...state,
        dirty: true,
        history,
        future,
        flow: entry.flow,
        nodeMap: entry.nodeMap,
        nodeDimensions: reconcileNodeDimensions(state.nodeMap, entry.nodeMap, state.nodeDimensions),
        selectedNodes: entry.selectedNodes,
        layoutReady: !state.autoLayout || entry.nodeMap.size === 0,
      };
    }
    case "CLEAR_HISTORY": {
      if (state.history.length === 0 && state.future.length === 0) return state;
      return { ...state, history: [], future: [] };
    }
    default: {
      return state;
    }
  }
}
