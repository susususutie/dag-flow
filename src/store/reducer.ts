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
        flow,
        history: pushSnapshot(state.history, snapshotOf(state)),
        future: [],
        layoutEpoch: 0,
      };
    }
    case "SET_NODE_MAP": {
      const nodeMap = new Map(action.payload);
      const selectedNodes = new Set(
        Array.from(nodeMap.values())
          .filter((node) => node.selected && (node.selectable ?? state.nodesSelectable))
          .map((node) => node.id),
      );
      if (nodeMap === state.nodeMap) return state;
      return {
        ...state,
        nodeMap,
        selectedNodes,
        history: pushSnapshot(state.history, snapshotOf(state)),
        future: [],
        layoutEpoch: 0,
      };
    }
    case "SET_DAG": {
      const flow =
        action.payload.flow === state.flow ? state.flow : new Flow(action.payload.flow).toArray();
      const nodeMap =
        action.payload.nodeMap === state.nodeMap ? state.nodeMap : new Map(action.payload.nodeMap);
      if (flow === state.flow && nodeMap === state.nodeMap) return state;
      const selectedNodes =
        nodeMap === state.nodeMap
          ? state.selectedNodes
          : new Set(
              Array.from(nodeMap.values())
                .filter((node) => node.selected && (node.selectable ?? state.nodesSelectable))
                .map((node) => node.id),
            );
      return {
        ...state,
        dirty: true,
        flow,
        nodeMap,
        selectedNodes,
        history: pushSnapshot(state.history, snapshotOf(state)),
        future: [],
        layoutEpoch: 0,
      };
    }
    case "DELETE_NODE": {
      const { ids } = action.payload;
      const list = Array.isArray(ids) ? ids : [ids];
      const nodeMap = new Map(state.nodeMap);
      const flow = new Flow(state.flow);
      const nodeDimensions = new Map(state.nodeDimensions);
      const computedPositions = new Map(state.computedPositions);
      const dragPositions = new Map(state.dragPositions);
      const selectedNodes = new Set(state.selectedNodes);
      const existingIds = list.filter((id) => nodeMap.has(id) || flow.hasNode(id));
      if (existingIds.length === 0) return state;

      existingIds.forEach((id) => {
        nodeMap.delete(id);
        flow.remove(id);
        nodeDimensions.delete(id);
        computedPositions.delete(id);
        dragPositions.delete(id);
        selectedNodes.delete(id);
      });
      return {
        ...state,
        dirty: true,
        flow: flow.toArray(),
        nodeMap,
        nodeDimensions,
        computedPositions,
        dragPositions,
        selectedNodes,
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
    case "SET_COMPUTED_POSITIONS": {
      const next = action.payload;
      if (next === state.computedPositions) return state;
      return { ...state, computedPositions: next };
    }
    case "UPDATE_NODE_POSITION": {
      const { id, position } = action.payload;
      if (!state.nodeMap.has(id)) return state;
      const dragPositions = new Map(state.dragPositions);
      dragPositions.set(id, { x: position.x, y: position.y });
      return { ...state, dragPositions };
    }
    case "UPDATE_CONNECTING": {
      const { edge } = action.payload;
      if (edge === state.connectingEdge) return state;
      return { ...state, connectingEdge: edge };
    }
    case "CLEAR_NODE_POSITIONS": {
      const { ids } = action.payload;
      if (ids.length === 0) return state;
      const dragPositions = new Map(state.dragPositions);
      let hasChange = false;
      for (const id of ids) {
        if (dragPositions.delete(id)) hasChange = true;
      }
      return hasChange ? { ...state, dragPositions } : state;
    }
    case "COMMIT_NODE_POSITIONS": {
      const { positions, clearIds } = action.payload;
      if (positions.size === 0 && (!clearIds || clearIds.length === 0)) return state;
      const nodeMap = new Map(state.nodeMap);
      let hasChange = false;
      for (const [id, position] of positions) {
        const node = nodeMap.get(id);
        if (!node) continue;
        if (node.position?.x === position.x && node.position?.y === position.y) continue;
        nodeMap.set(id, { ...node, position: { x: position.x, y: position.y } });
        hasChange = true;
      }
      let dragPositions = state.dragPositions;
      if (clearIds && clearIds.length > 0) {
        dragPositions = new Map(dragPositions);
        for (const id of clearIds) dragPositions.delete(id);
      }
      if (!hasChange && dragPositions === state.dragPositions) return state;
      return {
        ...state,
        dirty: true,
        nodeMap,
        dragPositions,
        layoutEpoch: 0,
        history: pushSnapshot(state.history, snapshotOf(state)),
        future: [],
      };
    }
    case "UPDATE_SELECTED_NODE": {
      const { id } = action.payload;

      const flow = new Flow(state.flow);
      if (!flow.hasNode(id)) return state;

      // 单选语义：点击未选中节点时仅选中它，点击已选中节点时取消选中
      const selectedNodes = new Set<string>();
      if (state.selectedNodes.has(id)) {
        selectedNodes.delete(id);
      } else {
        selectedNodes.add(id);
      }
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
        selectedNodes: entry.selectedNodes,
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
        selectedNodes: entry.selectedNodes,
      };
    }
    case "CLEAR_HISTORY": {
      if (state.history.length === 0 && state.future.length === 0) return state;
      return { ...state, history: [], future: [] };
    }
    case "FORCE_LAYOUT": {
      return { ...state, layoutEpoch: state.layoutEpoch + 1 };
    }
    default: {
      return state;
    }
  }
}
