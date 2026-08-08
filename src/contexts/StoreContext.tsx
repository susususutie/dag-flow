import { createContext } from "react";
import type {
  CanvasAction,
  CanvasInteraction,
  CanvasState,
  StoreState,
  CanvasConfigProps,
} from "../types/index.ts";
import type { DAGInstance, ViewApi } from "../types/index.ts";
import type { DAGNode } from "../types/index.ts";
import type { FlowModel } from "../types/index.ts";
import type { Viewport } from "../types/index.ts";

/** 画布状态（不含 transform） */
export const CanvasContext = createContext<CanvasState | undefined>(undefined);

/** 画布 reducer dispatch */
export const CanvasDispatchContext = createContext<((action: CanvasAction) => void) | undefined>(
  undefined,
);

/** 高频变化的画布视口状态，与拓扑和业务状态分开订阅 */
export const CanvasTransformContext = createContext<Viewport | undefined>(undefined);

/** 交互回调集合 */
export const InteractionContext = createContext<CanvasInteraction | undefined>(undefined);

/** store 实例（内部使用） */
export const CanvasInstanceContext = createContext<
  | {
      configure: (nextProps: CanvasConfigProps) => void;
      getTransform: () => Viewport;
      getFlow: () => FlowModel;
      getNodes: () => DAGNode[];
      getDirty: () => boolean;
      getState: () => StoreState;
      setViewApi: (viewApi: ViewApi) => void;
      clearViewApi: (viewApi: ViewApi) => void;
    }
  | undefined
>(undefined);

/** DAG 实例（对外公开方法） */
export const DAGInstanceContext = createContext<DAGInstance | undefined>(undefined);

/** 当前节点数组 */
export const DAGNodesContext = createContext<DAGNode[] | undefined>(undefined);

/** 当前拓扑结构 */
export const DAGFlowContext = createContext<FlowModel | undefined>(undefined);

/** 布局配置（来源于 CanvasProvider.layout，部分组件可覆盖） */
export const LayoutContext = createContext<{
  hGap?: number;
  vGap?: number;
  lineWidth?: number;
  lineColor?: string;
}>({});

/** 节点上下文（自定义节点组件可通过 useNode 读取） */
export const NodeContext = createContext<{
  id?: string;
  type?: string;
  data?: Record<string, unknown>;
  selectable?: boolean;
  selected?: boolean;
  isSelected?: boolean;
}>({});
