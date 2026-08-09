import type { StoreState } from "../types/index.ts";
import type { DAGNode } from "../types/index.ts";
import type { FitViewOptions, Modifier, Viewport } from "../types/index.ts";

/** 画布初始状态 */
const initialState: StoreState = {
  uid: "", // DagFlow 实例的唯一标识
  // 画布配置
  transform: { x: 0, y: 0, zoom: 1 },
  defaultViewport: { x: 0, y: 0, zoom: 1 },
  dirty: false, // flow/nodeMap 是否有变更
  minZoom: 0.5, // 最小缩放比例，默认 0.5
  maxZoom: 2, // 最大缩放比例，默认 2
  fitView: false, // 是否初始适应内容（React Flow fitView），默认不开启
  fitViewOptions: { padding: 0, horizontalAlign: "left", verticalAlign: "top" }, // fitView 配置
  zoomOnScroll: true, // 是否在滚动时缩放，默认为 true
  zoomModifier: "none", // 'none' | 'ctrl' | 'meta'：缩放修饰键，默认直接缩放
  panOnScroll: false, // 是否在滚动时平移，默认为 false
  panScrollModifier: "none", // 平移滚动修饰键，panOnScroll 为 true 时生效
  panOnDrag: true, // 是否在左键按住拖拽时平移，默认为 true
  panDragModifier: "none", // 平移拖拽修饰键，panOnDrag 为 true 时生效
  nodesSelectable: true, // 节点是否可选中，默认为 true；可由 node.selectable 覆盖
  nodesDraggable: true,
  direction: "horizontal",
  selectedNodes: new Set<string>(),
  flow: [],
  nodeMap: new Map<string, DAGNode>(),
  nodeDimensions: new Map(),
  connectingEdge: null,
  nodeTypes: {},
  history: [],
  future: [],
};

export default initialState;

/** 默认 fitView 配置 */
export const defaultFitViewOptions: Required<
  Pick<FitViewOptions, "padding" | "horizontalAlign" | "verticalAlign">
> &
  Omit<FitViewOptions, "padding" | "horizontalAlign" | "verticalAlign"> = {
  padding: 0,
  horizontalAlign: "left",
  verticalAlign: "top",
};

/** 默认视口 */
export const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 };

/** 默认修饰键 */
export const defaultModifier: Modifier = "none";
