import "./styles/style.css";

// 容器组件
export { default as DAGCanvas } from "./container/DAGCanvas/DAGCanvas.tsx";
export type { DAGCanvasProps } from "./container/DAGCanvas/DAGCanvas.tsx";
export { default as DAGRenderer } from "./container/DAGRenderer/DAGRenderer.tsx";

// Provider 与内部 store 上下文
export { default as DAGProvider } from "./components/DAGProvider/DAGProvider.tsx";

// hooks
export { default as useDAGState } from "./hooks/useDAGState.ts";
export { default as useDAGInstance } from "./hooks/useDAGInstance.ts";
export { default as useNodes } from "./hooks/useNodes.ts";
export { default as useFlow } from "./hooks/useFlow.ts";
export { default as useViewport } from "./hooks/useViewport.ts";
export { default as useNode } from "./hooks/useNode.ts";
export { default as useCanvasState } from "./hooks/useCanvasState.ts";
export { default as useCanvasInteraction } from "./hooks/useCanvasInteraction.ts";

// 附加组件
export { default as MiniMap } from "./additional-components/MiniMap.tsx";
export type { MiniMapProps } from "./additional-components/MiniMap.tsx";
export { default as Controls } from "./additional-components/Controls.tsx";
export type { ControlsProps } from "./additional-components/Controls.tsx";
export { default as Background } from "./additional-components/Background.tsx";
export type { BackgroundProps } from "./additional-components/Background.tsx";

// 模型与工具
export { default as applyNodeChanges } from "./utils/changes.ts";
export { default as Flow } from "./utils/Flow.ts";
export { computeLayout, defaultLayoutEngine, getNodesBounds } from "./utils/layout.ts";
export { default as computeFitView } from "./utils/geometry.ts";
export { getSmoothStepPath, getBezierPath, getStraightPath } from "./utils/edges/paths.ts";
export { palette, statusColorMap, isValidColor, resolveLineColor } from "./utils/color.ts";

// 类型
export type {
  DAGNode,
  NodeComponentProps,
  NodeProps,
  NodeTypes,
  XYPosition,
  FlowModel,
  FlowStep,
  FlowPath,
  ParallelGroup,
  NodePosition,
  FlowChangeReason,
  NodeChange,
  NodeChanges,
  DAGInstance,
  DAGData,
  OnBeforeDeleteResult,
  ViewApi,
  Viewport,
  FitViewOptions,
  LayoutConfig,
  LayoutEngine,
  LayoutEngineOptions,
  Modifier,
  NodeMeasure,
  Padding,
  StatusColor,
  CanvasAction,
  CanvasInteraction,
  CanvasState,
  CanvasProviderProps,
  StoreState,
} from "./types/index.ts";
