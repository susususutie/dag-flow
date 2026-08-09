import type { DAGNode, NodeComponentProps, XYPosition } from "./nodes.ts";
import type { FlowModel } from "./flow.ts";

/** 画布视口状态（React Flow viewport） */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/** 缩放/平移修饰键 */
export type Modifier = "none" | "ctrl" | "meta";

/** DAG 连线方向；只控制统一 Handle 和边端点，不配置布局算法。 */
export type FlowDirection = "horizontal" | "vertical";

/** 附加组件（Controls / MiniMap）在画布内的预设停靠位置；"none" 表示不做定位（由外部容器布局） */
export type PanelPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "none";

/** 内置状态色关键词（默认节点与连线颜色语义） */
export type StatusColor = "primary" | "success" | "error" | "warning" | "processing" | "default";

/** 节点尺寸与位置测量 */
export interface NodeMeasure {
  width: number;
  height: number;
  x: number;
  y: number;
}

/** 单边留白对象 */
export interface Padding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/** fitView 调用参数 */
export interface FitViewOptions {
  padding?: number | Padding;
  minZoom?: number;
  maxZoom?: number;
  horizontalAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "center" | "bottom";
}

/** 布局引擎输入 */
export interface LayoutInput {
  nodes: DAGNode[];
  flow: FlowModel;
  dimensions: Map<string, { width: number; height: number }>;
}

/** 布局引擎内部结果 */
export interface LayoutResult {
  positions: Map<string, XYPosition>;
}

/** 布局引擎只计算坐标，不修改画布状态 */
export type LayoutEngine = (input: LayoutInput) => LayoutResult | Promise<LayoutResult>;

export interface LayoutOptions {
  engine?: LayoutEngine;
  signal?: AbortSignal;
}

export type { NodeComponentProps };
