/** 锚点方向（对齐 React Flow @xyflow/system Position 枚举值与钩点语义） */
export enum Position {
  TopLeft = "top-left",
  Top = "top",
  TopRight = "top-right",
  Left = "left",
  Center = "center",
  Right = "right",
  BottomLeft = "bottom-left",
  Bottom = "bottom",
  BottomRight = "bottom-right",
}

/** 内部边：由 flow 拓扑推导，渲染时补充锚点坐标 */
export interface EdgeSpec {
  id: string;
  source: string;
  target: string;
  data?: unknown;
  selected?: boolean;
}

/** 默认边组件接收的 props（锚点坐标由 EdgeLayer 补充） */
export interface EdgeProps {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  selected?: boolean;
  data?: unknown;
}
