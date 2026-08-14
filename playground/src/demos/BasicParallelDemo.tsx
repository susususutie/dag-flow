import { DagFlow, useDAGState } from "dag-flow";
import { LayoutRunner, PARALLEL_FLOW, PARALLEL_NODES, nodeTypes } from "./shared.tsx";

/** 并行拓扑：四路并行分支，含组内串行路径，验证并行组布局与连线汇聚 */
export default function BasicParallelDemo() {
  const { nodes, flow, setDAG, onNodesChange, onFlowChange } = useDAGState({
    nodes: PARALLEL_NODES,
    flow: PARALLEL_FLOW,
  });

  return (
    <div className="demo-canvas">
      <DagFlow
        nodes={nodes}
        flow={flow}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onFlowChange={onFlowChange}
      >
        <LayoutRunner nodes={nodes} setDAG={setDAG} />
      </DagFlow>
    </div>
  );
}
