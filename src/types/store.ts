import type { ReactNode } from "react";
import type { DAGNode, NodeTypes, XYPosition } from "./nodes.ts";
import type { FlowModel } from "./flow.ts";
import type { NodeChanges } from "./changes.ts";
import type { FitViewOptions, LayoutConfig, LayoutEngine, Modifier, Viewport } from "./general.ts";
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
  fitViewOptions: Required<Pick<FitViewOptions, "padding" | "horizontalAlign" | "verticalAlign">> &
    Omit<FitViewOptions, "padding" | "horizontalAlign" | "verticalAlign">;
  zoomOnScroll: boolean;
  zoomModifier: Modifier;
  panOnScroll: boolean;
  panScrollModifier: Modifier;
  panOnDrag: boolean;
  panDragModifier: Modifier;
  nodesSelectable: boolean;
  selectedNodes: Set<string>;
  flow: FlowModel;
  nodeMap: Map<string, DAGNode>;
  /** 节点测量尺寸（RF 式 per-node ResizeObserver 收集） */
  nodeDimensions: Map<string, { width: number; height: number }>;
  /** 布局引擎输出：仅未拖动（无 position）节点 */
  computedPositions: Map<string, XYPosition>;
  /** 拖动中的实时渲染位置（拖动 overlay，提交后并入 nodeMap 或清空回弹） */
  dragPositions: Map<string, XYPosition>;
  /** 连接手柄拖拽中的临时边（source 节点 + 鼠标画布坐标），null 表示无拖拽 */
  connectingEdge: { source: string; position: XYPosition } | null;
  layout: LayoutConfig;
  nodeTypes: NodeTypes;
  /** 布局引擎（默认列式路由）；自定义引擎返回的坐标不覆盖已固定节点 */
  layoutEngine?: LayoutEngine;
  /** 布局强制重算纪元（layout() 递增，忽略 pinned） */
  layoutEpoch: number;
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
  | { type: "SET_DAG"; payload: { flow: FlowModel; nodeMap: Map<string, DAGNode> } }
  | { type: "DELETE_NODE"; payload: { ids: string[] } }
  | {
      type: "SET_NODE_DIMENSIONS";
      payload: Map<string, { width: number; height: number }>;
    }
  | { type: "SET_COMPUTED_POSITIONS"; payload: Map<string, XYPosition> }
  | { type: "UPDATE_NODE_POSITION"; payload: { id: string; position: XYPosition } }
  | { type: "CLEAR_NODE_POSITIONS"; payload: { ids: string[] } }
  | {
      type: "COMMIT_NODE_POSITIONS";
      payload: { positions: Map<string, XYPosition>; clearIds?: string[] };
    }
  | {
      type: "UPDATE_CONNECTING";
      payload: { edge: { source: string; position: XYPosition } | null };
    }
  | { type: "UPDATE_SELECTED_NODE"; payload: { id: string } }
  | { type: "CLEAR_SELECTION" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_HISTORY" }
  | { type: "FORCE_LAYOUT" };

/** 交互回调集合（由 CanvasProvider 通过 ref 稳定持有） */
export interface CanvasInteraction {
  onNodeClick: (event: MouseEvent, node: DAGNode) => void;
  onBeforeDelete: (params: { nodes: DAGNode[] }) => OnBeforeDeleteResult;
  onPaneClick: (event: MouseEvent) => void;
}

/** StoreUpdater 同步到 store 的配置（减去 provider 专属字段） */
export type CanvasConfigProps = Omit<CanvasProviderProps, "children" | "style">;

/** CanvasProvider / DAGCanvas 完整配置 props */
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
  fitViewOptions?: FitViewOptions;
  zoomOnScroll?: boolean;
  zoomModifier?: Modifier;
  panOnScroll?: boolean;
  panScrollModifier?: Modifier;
  panOnDrag?: boolean;
  panDragModifier?: Modifier;
  nodesSelectable?: boolean;
  hGap?: number;
  vGap?: number;
  lineWidth?: number;
  lineColor?: string;
  nodeTypes?: NodeTypes;
  /**
   * 布局引擎：默认内置列式路由（消费 layout.hGap/vGap）。
   * 自定义引擎实现 LayoutEngine 契约即可替换默认路由，
   * 此时 hGap/vGap 等配置参数对引擎无效（由引擎自行决定如何消费 config）。
   */
  layoutEngine?: LayoutEngine;
  /**
   * 布局结果回调（受控模式同步用）：布局引擎/布局按钮/拖动焊死产生的位置变更通知。
   * 非受控模式内部 store 直接生效，无需订阅。
   */
  onLayoutChange?: (positions: Map<string, import("./nodes.ts").XYPosition>) => void;
  onNodesChange?: (changes: NodeChanges) => void;
  onFlowChange?: (flow: FlowModel, meta: { reason: "insert" | "remove" | "update" }) => void;
  onNodeClick?: (event: MouseEvent, node: DAGNode) => void;
  onBeforeDelete?: (params: { nodes: DAGNode[] }) => OnBeforeDeleteResult;
  onSelectionChange?: (params: { nodes: DAGNode[] }) => void;
  onPaneClick?: (event: MouseEvent) => void;
  onMove?: (event: MouseEvent | null, viewport: Viewport) => void;
}
