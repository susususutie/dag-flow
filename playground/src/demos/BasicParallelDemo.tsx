import { DagFlow } from "dag-flow";
import { PARALLEL_FLOW, PARALLEL_NODES, nodeTypes } from "./shared.tsx";

/** 并行拓扑：四路并行分支，含组内串行路径，验证并行组布局与连线汇聚 */
export default function BasicParallelDemo() {
  return (
    <div className="demo-canvas">
      <DagFlow
        defaultNodes={PARALLEL_NODES}
        defaultFlow={PARALLEL_FLOW}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 40 }}
      />
    </div>
  );
}
