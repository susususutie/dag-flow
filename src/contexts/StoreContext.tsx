import { createContext } from "react";
import type {
  CanvasAction,
  CanvasInteraction,
  CanvasState,
  StoreState,
  CanvasConfigProps,
} from "../types/index.ts";
import type { DAGInstance, ViewApi } from "../types/index.ts";
import type { DAGNode, PositionedDAGNode } from "../types/index.ts";
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
      getNodes: () => PositionedDAGNode[];
      getDirty: () => boolean;
      getState: () => StoreState;
      subscribe: (listener: () => void) => () => void;
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
