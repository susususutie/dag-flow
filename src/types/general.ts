import type { NodeComponentProps } from "./nodes.ts";
import type { FlowModel } from "./flow.ts";
import type { XYPosition } from "./nodes.ts";

/** 画布视口状态（React Flow viewport） */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/** 缩放/平移修饰键 */
export type Modifier = "none" | "ctrl" | "meta";

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

/** 布局配置（默认路由算法的控制参数；自定义引擎可忽略不需要的字段） */
export interface LayoutConfig {
  hGap: number;
  vGap: number;
  lineWidth: number;
  lineColor: string;
}

/** 布局引擎入参 */
export interface LayoutEngineOptions {
  /** 已测量节点尺寸（未测量节点由引擎回退默认 150×40） */
  dimensions: Map<string, { width: number; height: number }>;
  /** 用户固定位置（焊死节点，引擎不得覆盖） */
  pinned: Map<string, XYPosition>;
  /** 布局配置；默认引擎消费 hGap/vGap，自定义引擎按需忽略 */
  config: LayoutConfig;
}

/** 布局引擎：flow 拓扑 + 测量/固定 → 自动布局坐标。返回缺席节点不渲染（回退固定位置） */
export type LayoutEngine = (
  flow: FlowModel,
  options: LayoutEngineOptions,
) => Map<string, XYPosition>;

export type { NodeComponentProps };
