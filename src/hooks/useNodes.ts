import { useContext } from "react";
import { DAGNodesContext } from "../contexts/StoreContext.tsx";
import type { DAGNode } from "../types/index.ts";

/**
 * 订阅当前画布的节点数组，供 DagFlowProvider 下的画布外部组件读取。
 * 自定义节点组件应优先直接读取组件 props，避免订阅全量节点。
 */
export default function useNodes(): DAGNode[] {
  const nodes = useContext(DAGNodesContext);
  if (!nodes) throw new Error("useNodes must be used within a DagFlowProvider or DagFlow");
  return nodes;
}
