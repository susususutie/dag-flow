import type { DAGNode } from "./nodes.ts";

/** 节点变更（对齐 React Flow applyNodeChanges 的 onNodesChange 语义） */
export type NodeChange =
  | { type: "add"; item: DAGNode; index?: number }
  | { type: "remove"; id: string }
  | { type: "select"; id: string; selected: boolean }
  | { type: "replace"; id: string; item: DAGNode }
  | { type: "position"; id: string; position?: { x: number; y: number }; dragging?: boolean }
  | { type: "dimensions"; id: string; dimensions?: { width: number; height: number } };

export type NodeChanges = NodeChange[];
