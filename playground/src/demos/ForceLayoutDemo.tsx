import { useCallback, useState } from "react";
import { DagFlow, DagFlowProvider, useDAGInstance, useDAGState } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

export default function ForceLayoutDemo() {
  const dagState = useDAGState({ nodes: BASIC_NODES, flow: BASIC_FLOW });
  return (
    <DagFlowProvider>
      <div className="demo-scene">
        <div className="demo-controls">
          <LayoutBar setDAG={dagState.setDAG} />
        </div>
        <div className="demo-canvas">
          <DagFlow
            nodes={dagState.nodes}
            flow={dagState.flow}
            nodeTypes={nodeTypes}
            onNodesChange={dagState.onNodesChange}
            onFlowChange={dagState.onFlowChange}
          />
        </div>
      </div>
    </DagFlowProvider>
  );
}

function LayoutBar({ setDAG }: { setDAG: ReturnType<typeof useDAGState>["setDAG"] }) {
  const dag = useDAGInstance();
  const [status, setStatus] = useState("尚未执行布局");
  const runLayout = useCallback(async () => {
    const nextDAG = await dag.layout();
    setDAG(nextDAG);
    setStatus(`已计算 ${nextDAG.nodes.length} 个节点坐标`);
  }, [dag, setDAG]);

  return (
    <>
      <button onClick={runLayout}>计算并应用布局</button>
      <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{status}</span>
    </>
  );
}
