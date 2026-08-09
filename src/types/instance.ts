import type { DAGNode, PositionedDAGNode } from "./nodes.ts";
import type { FlowModel } from "./flow.ts";
import type { FitViewOptions, LayoutOptions, Viewport } from "./general.ts";

/** 删除前回调结果 */
export type OnBeforeDeleteResult =
  | boolean
  | { nodes: DAGNode[] }
  | Promise<boolean | { nodes: DAGNode[] }>;

/** 需要原子更新的 DAG 数据 */
export interface DAGData {
  nodes: DAGNode[];
  flow: FlowModel;
}

export interface PositionedDAGData extends Omit<DAGData, "nodes"> {
  nodes: PositionedDAGNode[];
}

/**
 * DAG 画布实例（对齐 React Flow useReactFlow 常用方法）。
 * 通过 useDAGInstance() 获取；节点与拓扑需要联动时使用 setDAG 原子更新，避免中间不一致状态。
 */
export interface DAGInstance {
  getDAG: () => PositionedDAGData;
  getNodes: () => PositionedDAGNode[];
  getNode: (id: string) => PositionedDAGNode | undefined;
  getFlow: () => FlowModel;
  setDAG: (value: DAGData | ((dag: PositionedDAGData) => DAGData)) => void;
  updateNode: (
    id: string,
    update: Partial<DAGNode> | ((node: DAGNode) => Partial<DAGNode>),
  ) => void;
  updateNodeData: (
    id: string,
    update:
      | Record<string, unknown>
      | ((data: Record<string, unknown> | undefined) => Record<string, unknown>),
  ) => void;
  deleteNode: (node: string | DAGNode) => Promise<{ deletedNodes: DAGNode[] }>;
  deleteNodes: (
    nodes: Array<string | DAGNode> | string | DAGNode,
  ) => Promise<{ deletedNodes: DAGNode[] }>;
  selectNode: (id: string) => boolean;
  clearSelection: () => void;
  getFlowElement: () => HTMLElement | undefined;
  fitView: (options?: FitViewOptions) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (zoom: number) => void;
  setViewport: (value: Partial<Viewport> | ((viewport: Viewport) => Partial<Viewport>)) => void;
  getViewport: () => Viewport;
  /** 使用最新已提交 DAG 和节点尺寸计算坐标，不修改画布状态 */
  layout: (options?: LayoutOptions) => Promise<PositionedDAGData>;
}

/** 视口 API（由渲染层注册） */
export interface ViewApi {
  getFlowElement: () => HTMLElement | undefined;
  fitView: (options?: FitViewOptions) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (zoom: number) => void;
}
