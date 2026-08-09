import { useContext } from "react";
import { DAGFlowContext } from "../contexts/StoreContext.tsx";
import type { FlowModel } from "../types/index.ts";

/**
 * 当前嵌套 flow；拓扑变化时重新渲染消费者。
 */
export default function useFlow(): FlowModel {
  const flow = useContext(DAGFlowContext);
  if (!flow) throw new Error("useFlow must be used within a DagFlowProvider or DagFlow");
  return flow;
}
