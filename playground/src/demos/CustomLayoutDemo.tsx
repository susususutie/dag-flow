import { useState } from "react";
import { DagFlow, Flow, useDAGState } from "dag-flow";
import type { LayoutEngine, XYPosition } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, LayoutRunner, nodeTypes } from "./shared.tsx";

const snakeEngine: LayoutEngine = ({ flow }) => {
  const ids = new Flow(flow).getNodeIds();
  const positions = new Map<string, XYPosition>();
  for (const [index, id] of ids.entries()) {
    const col = index % 4;
    const row = Math.floor(index / 4);
    positions.set(id, { x: col * 310, y: row * 96 });
  }
  return { positions };
};

export default function CustomLayoutDemo() {
  const [engineName, setEngineName] = useState<"default" | "snake">("default");
  const { nodes, flow, setDAG, onNodesChange, onFlowChange } = useDAGState({
    nodes: BASIC_NODES,
    flow: BASIC_FLOW,
  });
  const engine = engineName === "snake" ? snakeEngine : undefined;

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <button
          className={engineName === "default" ? "demo-chip demo-chip--active" : "demo-chip"}
          onClick={() => setEngineName("default")}
        >
          默认列式布局
        </button>
        <button
          className={engineName === "snake" ? "demo-chip demo-chip--active" : "demo-chip"}
          onClick={() => setEngineName("snake")}
        >
          自定义蛇形布局
        </button>
      </div>
      <div className="demo-canvas">
        <DagFlow
          nodes={nodes}
          flow={flow}
          nodeTypes={nodeTypes}
          layoutEngine={engine}
          onNodesChange={onNodesChange}
          onFlowChange={onFlowChange}
        >
          <LayoutRunner engine={engine} nodes={nodes} setDAG={setDAG} />
        </DagFlow>
      </div>
    </div>
  );
}
