import type { ReactNode } from "react";
import type { DAGNode, NodeTypes, XYPosition } from "./nodes.ts";
import type { FlowModel } from "./flow.ts";
import type { NodeChanges } from "./changes.ts";
import type { FitViewOptions, FlowDirection, LayoutEngine, Modifier, Viewport } from "./general.ts";
import type { OnBeforeDeleteResult } from "./instance.ts";

/** 画布状态（transform 单独发布，见 CanvasTransformContext） */
export type CanvasState = Omit<StoreState, "transform">;

/** CanvasProvider 状态 */
export interface StoreState {
  uid: string;
  transform: Viewport;
  defaultViewport: Viewport;
  dirty: boolean;
  minZoom: number;
  maxZoom: number;
  fitView: boolean;
  /** 是否在初始测量和拓扑变化后自动执行布局 */
  autoLayout: boolean;
  /** 自动布局结果是否已应用；初始 fitView 需等待该状态 */
  layoutReady: boolean;
  fitViewOptions: Required<Pick<FitViewOptions, "padding" | "horizontalAlign" | "verticalAlign">> &
    Omit<FitViewOptions, "padding" | "horizontalAlign" | "verticalAlign">;
  zoomOnScroll: boolean;
  zoomModifier: Modifier;
  panOnScroll: boolean;
  panScrollModifier: Modifier;
  panOnDrag: boolean;
  panDragModifier: Modifier;
  nodesSelectable: boolean;
  nodesDraggable: boolean;
  direction: FlowDirection;
  selectedNodes: Set<string>;
  flow: FlowModel;
  nodeMap: Map<string, DAGNode>;
  /** 节点测量尺寸（RF 式 per-node ResizeObserver 收集） */
  nodeDimensions: Map<string, { width: number; height: number }>;
  /** 连接手柄拖拽中的临时边（source 节点 + 鼠标画布坐标），null 表示无拖拽 */
  connectingEdge: { source: string; position: XYPosition } | null;
  nodeTypes: NodeTypes;
  /** 撤销历史（flow/nodeMap 快照，最近在前，上限 50） */
  history: StoreStateSnapshot[];
  /** 重做历史 */
  future: StoreStateSnapshot[];
}

/** 撤销/重做快照：拓扑与节点、选中集 */
export interface StoreStateSnapshot {
  flow: FlowModel;
  nodeMap: Map<string, DAGNode>;
  selectedNodes: Set<string>;
}

/** 画布 reducer action */
export type CanvasAction =
  | { type: "BATCH"; payload: CanvasAction[] }
  | { type: "SET_TRANSFORM"; payload: Partial<Viewport> }
  | { type: "ZOOM"; payload: { delta: number; mouseX: number; mouseY: number } }
  | {
      type: "ZOOM_TO";
      payload: { zoom?: number; factor?: number; centerX: number; centerY: number };
    }
  | { type: "PAN_BY"; payload: { dx: number; dy: number } }
  | { type: "PAN"; payload: { x: number; y: number } }
  | { type: "SET_FLOW"; payload: FlowModel }
  | { type: "SET_NODE_MAP"; payload: Map<string, DAGNode> }
  | { type: "APPLY_LAYOUT"; payload: Map<string, XYPosition> }
  | { type: "SET_DAG"; payload: { flow: FlowModel; nodeMap: Map<string, DAGNode> } }
  | { type: "SYNC_DAG"; payload: { flow: FlowModel; nodeMap: Map<string, DAGNode> } }
  | { type: "DELETE_NODE"; payload: { ids: string[] } }
  | {
      type: "SET_NODE_DIMENSIONS";
      payload: Map<string, { width: number; height: number }>;
    }
  | {
      type: "UPDATE_NODE_POSITION";
      payload: {
        id: string;
        position: XYPosition;
        dragging?: boolean;
        /** 一次拖拽的起点，仅在 dragging=false 时用于生成撤销快照 */
        origin?: XYPosition;
      };
    }
  | {
      type: "UPDATE_CONNECTING";
      payload: { edge: { source: string; position: XYPosition } | null };
    }
  | { type: "UPDATE_SELECTED_NODE"; payload: { id: string } }
  | { type: "CLEAR_SELECTION" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_HISTORY" };

/** 交互回调集合（由 CanvasProvider 通过 ref 稳定持有） */
export interface CanvasInteraction {
  onNodeClick: (event: MouseEvent, node: DAGNode) => void;
  onBeforeDelete: (params: { nodes: DAGNode[] }) => OnBeforeDeleteResult;
  onPaneClick: (event: MouseEvent) => void;
}

/** StoreUpdater 同步到 store 的配置（减去 provider 专属字段） */
export type CanvasConfigProps = Omit<CanvasProviderProps, "children" | "style">;

/** CanvasProvider / DagFlow 完整配置 props */
export interface CanvasProviderProps {
  uid?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  flow?: FlowModel;
  defaultFlow?: FlowModel;
  nodes?: DAGNode[];
  defaultNodes?: DAGNode[];
  defaultViewport?: Viewport;
  minZoom?: number;
  maxZoom?: number;
  fitView?: boolean;
  /** 初始测量和拓扑变化后自动布局，默认 true */
  autoLayout?: boolean;
  fitViewOptions?: FitViewOptions;
  zoomOnScroll?: boolean;
  zoomModifier?: Modifier;
  panOnScroll?: boolean;
  panScrollModifier?: Modifier;
  panOnDrag?: boolean;
  panDragModifier?: Modifier;
  nodesSelectable?: boolean;
  nodesDraggable?: boolean;
  /** 统一 Handle 与边端点方向；布局算法方向由 layoutEngine 自行配置 */
  direction?: FlowDirection;
  nodeTypes?: NodeTypes;
  /** 布局引擎行为依赖；算法配置由引擎闭包持有，不进入 store */
  layoutEngine?: LayoutEngine;
  onNodesChange?: (changes: NodeChanges) => void;
  onFlowChange?: (flow: FlowModel, meta: { reason: "insert" | "remove" | "update" }) => void;
  onNodeClick?: (event: MouseEvent, node: DAGNode) => void;
  onBeforeDelete?: (params: { nodes: DAGNode[] }) => OnBeforeDeleteResult;
  onSelectionChange?: (params: { nodes: DAGNode[] }) => void;
  onPaneClick?: (event: MouseEvent) => void;
  onMove?: (event: MouseEvent | null, viewport: Viewport) => void;
}
