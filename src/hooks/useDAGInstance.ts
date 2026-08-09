import { useContext } from "react";
import { DAGInstanceContext } from "../contexts/StoreContext.tsx";
import type { DAGInstance } from "../types/index.ts";

/**
 * 获取稳定的 DAG 实例，用于按需查询或修改画布，不订阅状态变化。
 * 响应式读取请使用 useNodes、useFlow 或 useViewport。
 * nodes 与 flow 需要联动时使用 setDAG 原子更新，避免产生中间不一致状态。
 * deleteNode / deleteNodes 为命令式操作，执行 onBeforeDelete 后原子更新 nodes 与 flow。
 */
export default function useDAGInstance(): DAGInstance {
  const instance = useContext(DAGInstanceContext);
  if (!instance) throw new Error("useDAGInstance must be used within a DagFlowProvider or DagFlow");
  return instance;
}
