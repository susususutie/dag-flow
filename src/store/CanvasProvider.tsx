import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import {
  CanvasContext,
  CanvasDispatchContext,
  CanvasInstanceContext,
  CanvasTransformContext,
  DAGFlowContext,
  DAGInstanceContext,
  DAGNodesContext,
  InteractionContext,
} from "../contexts/StoreContext.tsx";
import canvasReducer from "./reducer.ts";
import {
  createNodeMap,
  assertValidDAG,
  flowsEqual,
  getNodesFromState,
  isNodeSelectable,
  nodeMapsEqual,
  syncCanvasProps,
} from "./utils.ts";
import { createInitialState } from "./utils.ts";
import Flow from "../utils/Flow.ts";
import type { CanvasAction, CanvasProviderProps, CanvasState, StoreState } from "../types/index.ts";
import type { DAGInstance, OnBeforeDeleteResult, ViewApi } from "../types/index.ts";
import type { DAGNode, LayoutEngine, PositionedDAGData } from "../types/index.ts";
import type { NodeChanges } from "../types/index.ts";
import { defaultLayoutEngine } from "../utils/layout.ts";

const GRAPH_ACTION_TYPES = new Set([
  "DELETE_NODE",
  "UPDATE_SELECTED_NODE",
  "CLEAR_SELECTION",
  "SET_FLOW",
  "SET_DAG",
  "APPLY_LAYOUT",
  "UPDATE_NODE_POSITION",
  "UNDO",
  "REDO",
]);

/** 基于 reducer 已接受的前后状态生成 changes，避免无效 action 产生错误通知 */
function buildNodeChanges(
  previousState: StoreState,
  nextState: StoreState,
  actions: CanvasAction[],
): NodeChanges {
  const changes: NodeChanges = [];
  const positionChanges = new Map(
    actions
      .filter((action) => action.type === "UPDATE_NODE_POSITION")
      .map((action) => [action.payload.id, action.payload]),
  );
  actions
    .filter((action) => action.type === "APPLY_LAYOUT")
    .forEach((action) => {
      action.payload.forEach((position, id) => {
        positionChanges.set(id, { id, position, dragging: false });
      });
    });

  previousState.nodeMap.forEach((_node, id) => {
    if (!nextState.nodeMap.has(id)) changes.push({ type: "remove", id });
  });
  nextState.nodeMap.forEach((node, id) => {
    if (!previousState.nodeMap.has(id)) {
      changes.push({ type: "add", item: node });
    } else if (previousState.nodeMap.get(id) !== node && !positionChanges.has(id)) {
      changes.push({ type: "replace", id, item: node });
    }
  });

  const selectedIds = new Set([...previousState.selectedNodes, ...nextState.selectedNodes]);
  selectedIds.forEach((id) => {
    const wasSelected = previousState.selectedNodes.has(id);
    const selected = nextState.selectedNodes.has(id);
    if (wasSelected !== selected) changes.push({ type: "select", id, selected });
  });

  positionChanges.forEach(({ id, position, dragging }) => {
    const node = nextState.nodeMap.get(id);
    if (!node) return;
    changes.push({ type: "position", id, position, dragging });
  });

  return changes;
}

function getGraphActions(action: CanvasAction): CanvasAction[] {
  if (action.type !== "BATCH") return GRAPH_ACTION_TYPES.has(action.type) ? [action] : [];
  return action.payload.filter((item) => GRAPH_ACTION_TYPES.has(item.type));
}

function getFlowChangeReason(
  previousState: StoreState,
  nextState: StoreState,
): "insert" | "update" | "remove" {
  if (nextState.nodeMap.size > previousState.nodeMap.size) return "insert";
  if (nextState.nodeMap.size < previousState.nodeMap.size) return "remove";
  return "update";
}

interface CanvasProviderPropsWithChildren extends CanvasProviderProps {
  children?: ReactNode;
  ref?: Ref<DAGInstance>;
}

/**
 * 画布状态管理器，接收的参数已经过外层 DagFlow 处理，视为合法。
 */
function CanvasProvider(props: CanvasProviderPropsWithChildren) {
  const {
    ref,
    children,
    onNodesChange,
    onFlowChange,
    onNodeClick,
    onBeforeDelete,
    onSelectionChange,
    onPaneClick,
    onMove,
  } = props;

  const [state, setState] = useState<StoreState>(() => createInitialState(props));

  // dispatch 闭包不随 state 变化重建，连续同步操作通过 ref 读取并立即推进最新状态
  const stateRef = useRef(state);
  stateRef.current = state;
  const configuredByCanvasRef = useRef(false);
  const viewApiRef = useRef<ViewApi | undefined>(undefined);
  const layoutEngineRef = useRef<LayoutEngine>(props.layoutEngine ?? defaultLayoutEngine);
  const graphRevisionRef = useRef(0);
  const layoutRequestIdRef = useRef(0);
  const stateListenersRef = useRef(new Set<() => void>());
  const onNodesChangeRef = useRef(onNodesChange);
  const onFlowChangeRef = useRef(onFlowChange);

  const interactionRef = useRef({ onNodeClick, onBeforeDelete, onSelectionChange, onPaneClick });
  const onMoveRef = useRef(onMove);
  if (!configuredByCanvasRef.current) {
    onNodesChangeRef.current = onNodesChange;
    onFlowChangeRef.current = onFlowChange;
    interactionRef.current.onNodeClick = onNodeClick;
    interactionRef.current.onBeforeDelete = onBeforeDelete;
    interactionRef.current.onSelectionChange = onSelectionChange;
    interactionRef.current.onPaneClick = onPaneClick;
    onMoveRef.current = onMove;
  }

  const dispatchWithChange = useMemo(() => {
    const notify = (action: CanvasAction, previousState: StoreState, nextState: StoreState) => {
      const graphActions = getGraphActions(action);
      if (graphActions.length === 0) return;

      const changes = buildNodeChanges(previousState, nextState, graphActions);
      if (changes.length > 0) {
        onNodesChangeRef.current?.(changes);
      }

      if (!flowsEqual(previousState.flow, nextState.flow)) {
        onFlowChangeRef.current?.(nextState.flow, {
          reason: getFlowChangeReason(previousState, nextState),
        });
      }
    };

    return (action: CanvasAction) => {
      const previousState = stateRef.current;
      const nextState = canvasReducer(previousState, action);
      if (nextState === previousState) return;

      stateRef.current = nextState;
      if (
        previousState.nodeMap !== nextState.nodeMap ||
        previousState.flow !== nextState.flow ||
        previousState.nodeDimensions !== nextState.nodeDimensions
      ) {
        graphRevisionRef.current += 1;
      }
      stateListenersRef.current.forEach((listener) => listener());
      setState(nextState);
      notify(action, previousState, nextState);
    };
  }, []);

  const instance = useMemo(
    () => ({
      configure: (nextProps: Parameters<typeof syncCanvasProps>[1]) => {
        const initializeViewport = !configuredByCanvasRef.current;
        configuredByCanvasRef.current = true;
        onNodesChangeRef.current = nextProps.onNodesChange;
        onFlowChangeRef.current = nextProps.onFlowChange;
        interactionRef.current.onNodeClick = nextProps.onNodeClick;
        interactionRef.current.onBeforeDelete = nextProps.onBeforeDelete;
        interactionRef.current.onSelectionChange = nextProps.onSelectionChange;
        interactionRef.current.onPaneClick = nextProps.onPaneClick;
        onMoveRef.current = nextProps.onMove;
        layoutEngineRef.current = nextProps.layoutEngine ?? defaultLayoutEngine;

        const nextState = syncCanvasProps(stateRef.current, nextProps, initializeViewport);
        if (nextState === stateRef.current) return;
        const previousState = stateRef.current;
        stateRef.current = nextState;
        if (
          previousState.nodeMap !== nextState.nodeMap ||
          previousState.flow !== nextState.flow ||
          previousState.nodeDimensions !== nextState.nodeDimensions
        ) {
          graphRevisionRef.current += 1;
        }
        stateListenersRef.current.forEach((listener) => listener());
        setState(nextState);
      },
      getTransform: () => stateRef.current.transform,
      getFlow: () => stateRef.current.flow,
      getNodes: () => getNodesFromState(stateRef.current),
      getDirty: () => stateRef.current.dirty,
      getState: () => stateRef.current,
      subscribe: (listener: () => void) => {
        stateListenersRef.current.add(listener);
        return () => stateListenersRef.current.delete(listener);
      },
      setViewApi: (viewApi: ViewApi | undefined) => {
        viewApiRef.current = viewApi;
      },
      clearViewApi: (viewApi: ViewApi | undefined) => {
        if (viewApiRef.current === viewApi) viewApiRef.current = undefined;
      },
    }),
    [],
  );

  // 对外实例不暴露 configure、reducer state 等内部实现，并保持引用稳定
  const dagInstance: DAGInstance = useMemo(() => {
    const getNodes = () => getNodesFromState(stateRef.current);

    const deleteNodes = async (
      value: Array<string | DAGNode> | string | DAGNode,
    ): Promise<{ deletedNodes: DAGNode[] }> => {
      const items = Array.isArray(value) ? value : [value];
      const currentState = stateRef.current;
      const requestedNodes = items
        .map((item) => {
          const id = typeof item === "string" ? item : item?.id;
          if (!id) return null;
          return currentState.nodeMap.get(id) ?? (typeof item === "string" ? { id } : item);
        })
        .filter((node): node is DAGNode => node !== null);
      if (requestedNodes.length === 0) return { deletedNodes: [] };

      const result = await interactionRef.current.onBeforeDelete?.({ nodes: requestedNodes });
      if (result === false) return { deletedNodes: [] };

      const resolvedNodes = Array.isArray((result as { nodes?: DAGNode[] })?.nodes)
        ? (result as { nodes: DAGNode[] }).nodes
        : requestedNodes;
      const ids = [
        ...new Set(
          resolvedNodes.map((node) => (typeof node === "string" ? node : node?.id)).filter(Boolean),
        ),
      ];
      if (ids.length === 0) return { deletedNodes: [] };

      const latestState = stateRef.current;
      const deletedNodes = ids.map((id) => latestState.nodeMap.get(id) ?? { id });
      dispatchWithChange({ type: "DELETE_NODE", payload: { ids } });
      return { deletedNodes };
    };

    const setDAG = (value: Parameters<DAGInstance["setDAG"]>[0]) => {
      const currentState = stateRef.current;
      const currentNodes = getNodes();
      const current: PositionedDAGData = { nodes: currentNodes, flow: currentState.flow };
      const next = typeof value === "function" ? value(current) : value;
      const nodes = next.nodes;
      const flow = next.flow;
      const nextNodeMap = createNodeMap(nodes);
      assertValidDAG(nextNodeMap, flow);
      dispatchWithChange({
        type: "SET_DAG",
        payload: {
          nodeMap:
            nodes === currentNodes || nodeMapsEqual(nextNodeMap, currentState.nodeMap)
              ? currentState.nodeMap
              : nextNodeMap,
          flow,
        },
      });
    };

    const updateNode = (id: string, update: Parameters<DAGInstance["updateNode"]>[1]) => {
      const currentNode = stateRef.current.nodeMap.get(id);
      if (!currentNode) return;
      const nodeUpdate = typeof update === "function" ? update(currentNode) : update;
      if (!nodeUpdate) return;
      setDAG((current) => ({
        ...current,
        nodes: current.nodes.map((node) =>
          node.id === id ? { ...node, ...nodeUpdate, id } : node,
        ),
      }));
    };

    const updateNodeData = (id: string, update: Parameters<DAGInstance["updateNodeData"]>[1]) => {
      const currentNode = stateRef.current.nodeMap.get(id);
      if (!currentNode) return;
      const dataUpdate = typeof update === "function" ? update(currentNode.data) : update;
      if (!dataUpdate) return;
      updateNode(id, { data: { ...currentNode.data, ...dataUpdate } });
    };

    const selectNode = (id: string): boolean => {
      const currentState = stateRef.current;
      const node = currentState.nodeMap.get(id);
      if (!node || !isNodeSelectable(node, currentState.nodesSelectable)) return false;
      if (currentState.selectedNodes.has(id) && currentState.selectedNodes.size > 1) {
        dispatchWithChange({
          type: "BATCH",
          payload: [{ type: "CLEAR_SELECTION" }, { type: "UPDATE_SELECTED_NODE", payload: { id } }],
        });
      } else if (!currentState.selectedNodes.has(id)) {
        dispatchWithChange({ type: "UPDATE_SELECTED_NODE", payload: { id } });
      }
      return true;
    };

    const clearSelection = () => dispatchWithChange({ type: "CLEAR_SELECTION" });

    const waitForNodesInitialized = (signal?: AbortSignal) => {
      const isReady = () => {
        const currentState = stateRef.current;
        return (
          currentState.nodeMap.size === 0 ||
          Array.from(currentState.nodeMap.keys()).every((id) => currentState.nodeDimensions.has(id))
        );
      };
      if (isReady()) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          stateListenersRef.current.delete(check);
          signal?.removeEventListener("abort", abort);
        };
        const check = () => {
          if (!isReady()) return;
          cleanup();
          resolve();
        };
        const abort = () => {
          cleanup();
          reject(signal?.reason ?? new DOMException("Layout aborted", "AbortError"));
        };
        stateListenersRef.current.add(check);
        signal?.addEventListener("abort", abort, { once: true });
      });
    };

    const layout: DAGInstance["layout"] = async (options) => {
      const requestId = ++layoutRequestIdRef.current;
      if (options?.signal?.aborted) {
        throw options.signal.reason ?? new DOMException("Layout aborted", "AbortError");
      }
      await waitForNodesInitialized(options?.signal);
      const revision = graphRevisionRef.current;
      const currentState = stateRef.current;
      const nodes = getNodesFromState(currentState);
      const result = await (options?.engine ?? layoutEngineRef.current)({
        nodes,
        flow: currentState.flow,
        dimensions: new Map(currentState.nodeDimensions),
      });
      if (options?.signal?.aborted) {
        throw options.signal.reason ?? new DOMException("Layout aborted", "AbortError");
      }
      if (requestId !== layoutRequestIdRef.current || revision !== graphRevisionRef.current) {
        throw new Error("Layout result is stale");
      }
      return {
        flow: currentState.flow,
        nodes: nodes.map((node) => ({
          ...node,
          position: result.positions.get(node.id) ?? node.position,
        })),
      };
    };

    const setViewport = (value: Parameters<DAGInstance["setViewport"]>[0]) => {
      const currentState = stateRef.current;
      const currentViewport = currentState.transform;
      const nextViewport = typeof value === "function" ? value(currentViewport) : value;
      if (!nextViewport) return;
      const zoom = Math.max(
        currentState.minZoom,
        Math.min(currentState.maxZoom, nextViewport.zoom ?? currentViewport.zoom),
      );
      dispatchWithChange({
        type: "SET_TRANSFORM",
        payload: {
          x: nextViewport.x ?? currentViewport.x,
          y: nextViewport.y ?? currentViewport.y,
          zoom,
        },
      });
    };

    return {
      getDAG: () => ({ nodes: getNodes(), flow: stateRef.current.flow }),
      getNodes,
      getNode: (id: string) =>
        stateRef.current.nodeMap.get(id) as ReturnType<DAGInstance["getNode"]>,
      getFlow: () => stateRef.current.flow,
      setDAG,
      updateNode,
      updateNodeData,
      deleteNode: (value: string | DAGNode) => deleteNodes([value]),
      deleteNodes,
      selectNode,
      clearSelection,
      getFlowElement: () => viewApiRef.current?.getFlowElement(),
      fitView: (options) => viewApiRef.current?.fitView(options ?? stateRef.current.fitViewOptions),
      zoomIn: () => viewApiRef.current?.zoomIn(),
      zoomOut: () => viewApiRef.current?.zoomOut(),
      zoomTo: (zoom: number) => viewApiRef.current?.zoomTo(zoom),
      setViewport,
      getViewport: () => {
        const { x, y, zoom } = stateRef.current.transform;
        return { x, y, zoom };
      },
      layout,
    };
  }, [dispatchWithChange]);

  // CanvasProvider 直接使用时，也按完整 DAG 同步受控 nodes/flow。
  useEffect(() => {
    if (configuredByCanvasRef.current) return;
    const currentState = stateRef.current;
    const nextFlow = props.flow === undefined ? currentState.flow : new Flow(props.flow).toArray();
    const nextNodeMap =
      props.nodes === undefined ? currentState.nodeMap : createNodeMap(props.nodes);
    assertValidDAG(nextNodeMap, nextFlow);
    if (flowsEqual(nextFlow, currentState.flow) && nodeMapsEqual(nextNodeMap, currentState.nodeMap))
      return;
    dispatchWithChange({ type: "SET_DAG", payload: { flow: nextFlow, nodeMap: nextNodeMap } });
  }, [dispatchWithChange, props.flow, props.nodes]);

  // 交互回调通过 ref 稳定持有，避免回调引用变化触发节点组件重渲染
  const interaction = useMemo(
    () => ({
      onNodeClick: (event: MouseEvent, node: DAGNode) =>
        interactionRef.current.onNodeClick?.(event, node),
      onBeforeDelete: (params: { nodes: DAGNode[] }): OnBeforeDeleteResult =>
        interactionRef.current.onBeforeDelete?.(params) ?? true,
      onPaneClick: (event: MouseEvent) => interactionRef.current.onPaneClick?.(event),
    }),
    [],
  );

  // 选择变化通知（React Flow onSelectionChange）：跳过首次空选择，仅在实际变化时触发
  const isFirstSelection = useRef(true);
  const nodeMapRef = useRef(state.nodeMap);
  nodeMapRef.current = state.nodeMap;
  useEffect(() => {
    if (isFirstSelection.current) {
      isFirstSelection.current = false;
      return;
    }
    interactionRef.current.onSelectionChange?.({
      nodes: Array.from(state.selectedNodes)
        .map((id) => nodeMapRef.current.get(id))
        .filter((node): node is DAGNode => node !== undefined),
    });
  }, [state.selectedNodes]);

  // 视口移动/缩放变化通知（React Flow onMove）：跳过首次，仅在实际变化时触发
  const isFirstTransform = useRef(true);
  useEffect(() => {
    if (isFirstTransform.current) {
      isFirstTransform.current = false;
      return;
    }
    const { x, y, zoom } = state.transform;
    onMoveRef.current?.(null, { x, y, zoom });
  }, [state.transform]);

  // transform 单独发布，避免视口变化刷新拓扑消费者
  const canvasState = useMemo(() => {
    const { transform: _transform, ...rest } = state;
    return rest;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.uid,
    state.defaultViewport,
    state.dirty,
    state.minZoom,
    state.maxZoom,
    state.fitView,
    state.autoLayout,
    state.layoutReady,
    state.fitViewOptions,
    state.zoomOnScroll,
    state.zoomModifier,
    state.panOnScroll,
    state.panScrollModifier,
    state.panOnDrag,
    state.panDragModifier,
    state.flow,
    state.nodesSelectable,
    state.selectedNodes,
    state.nodeMap,
    state.nodeTypes,
    state.nodeDimensions,
    state.connectingEdge,
    state.nodesDraggable,
    state.direction,
    state.history,
    state.future,
  ]);

  const { nodeMap, selectedNodes } = state;
  const nodes = useMemo(
    () => getNodesFromState({ nodeMap, selectedNodes }),
    [nodeMap, selectedNodes],
  );

  useImperativeHandle(ref, () => dagInstance);

  return (
    <CanvasInstanceContext.Provider value={instance}>
      <DAGInstanceContext.Provider value={dagInstance}>
        <DAGNodesContext.Provider value={nodes}>
          <DAGFlowContext.Provider value={state.flow}>
            <CanvasDispatchContext.Provider value={dispatchWithChange}>
              <CanvasContext.Provider value={canvasState as CanvasState}>
                <CanvasTransformContext.Provider value={state.transform}>
                  <InteractionContext.Provider value={interaction}>
                    {children}
                  </InteractionContext.Provider>
                </CanvasTransformContext.Provider>
              </CanvasContext.Provider>
            </CanvasDispatchContext.Provider>
          </DAGFlowContext.Provider>
        </DAGNodesContext.Provider>
      </DAGInstanceContext.Provider>
    </CanvasInstanceContext.Provider>
  );
}

export default CanvasProvider;
