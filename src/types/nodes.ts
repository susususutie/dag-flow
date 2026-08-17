import type { ComponentType } from "react";

/** 画布坐标（对齐 React Flow XYPosition） */
export interface XYPosition {
  x: number;
  y: number;
}

/** 节点数据（React Flow nodes 子集） */
export interface DAGNode<T = Record<string, unknown>> {
  id: string;
  type?: string;
  data?: T;
  selectable?: boolean;
  selected?: boolean;
  /** 节点坐标；公共输入可省略，进入画布后归一化为 { x: 0, y: 0 } */
  position?: XYPosition;
  /** 节点是否可拖动；存在时覆盖画布级 nodesDraggable */
  draggable?: boolean;
  /** 节点框架元素的无障碍名称 */
  ariaLabel?: string;
}

/** 已进入画布或完成布局、坐标必定存在的节点 */
export type PositionedDAGNode<T = Record<string, unknown>> = DAGNode<T> & {
  position: XYPosition;
};

/**
 * 自定义节点组件接收的 props（对齐 React Flow NodeProps）。
 * 泛型为节点 data 类型，默认假设存在可选 label（内置 DefaultNode 渲染 data.label）。
 *
 * @example
 * ```tsx
 * import { type NodeProps } from "dag-flow";
 *
 * function ProcessNode({ data }: NodeProps<{ label: string; description?: string }>) {
 *   return <div>{data.label}</div>;
 * }
 * ```
 */
export interface NodeComponentProps<T = { label?: string }> {
  id: string;
  type?: string;
  data: T;
  selectable?: boolean;
  selected?: boolean;
  isSelected?: boolean;
  position: XYPosition;
  draggable: boolean;
  dragging: boolean;
}

/**
 * 节点渲染注册表 { [type]: Component }。
 * data 放宽为 any（对齐 React Flow NodeTypes），允许注册带任意 data 泛型的节点组件。
 */
export type NodeTypes = Record<string, ComponentType<NodeComponentProps & { data: any }>>;
