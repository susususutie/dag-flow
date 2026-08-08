/**
 * 嵌套 flow 拓扑模型（引擎模型）：
 * - 顶层元素为串行步骤：节点 id，或并行组（每组内部为 path 数组，path 为串行节点 id 数组）
 * - 示例：['a', [['b1'], ['b2-1', 'b2-2']], 'c']
 */
export type FlowPath = string[];

/** 并行组：多条并行路径 */
export type ParallelGroup = FlowPath[];

/** 单个步骤：串行节点 id 或并行组 */
export type FlowStep = string | ParallelGroup;

/** 完整拓扑结构 */
export type FlowModel = FlowStep[];

/** 节点在拓扑中的位置 */
export interface NodePosition {
  type: "serial" | "parallel";
  topIndex: number;
  parallelIndex: number | null;
  pathIndex: number | null;
  nodeIndexInPath: number | null;
}

/** 拓扑变更原因 */
export type FlowChangeReason = "insert" | "remove" | "update";
