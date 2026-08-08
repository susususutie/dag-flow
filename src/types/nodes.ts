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
  /** 手动/受控位置；存在即视为已拖动（自动布局焊死），缺省时由布局引擎计算 */
  position?: XYPosition;
  /** 节点是否可拖动，默认 true（可被全局关闭） */
  draggable?: boolean;
}

/** 自定义节点组件接收的 props */
export interface NodeComponentProps<T = Record<string, unknown>> {
  id: string;
  type?: string;
  data?: T;
  selectable?: boolean;
  selected?: boolean;
  isSelected?: boolean;
  position?: XYPosition;
  draggable?: boolean;
}

/** 节点渲染注册表 { [type]: Component } */
export type NodeTypes = Record<string, ComponentType<NodeComponentProps>>;
