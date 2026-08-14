import { useState } from "react";
import { DagFlow, Flow } from "dag-flow";
import type { LayoutEngine, XYPosition } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

const snakeEngine: LayoutEngine = ({ flow }) => {
  const ids = new Flow(flow).getNodeIds();
  const positions = new Map<string, XYPosition>();
  const columns = 4;
  for (const [index, id] of ids.entries()) {
    const row = Math.floor(index / columns);
    const offset = index % columns;
    const col = row % 2 === 0 ? offset : columns - offset - 1;
    positions.set(id, { x: col * 310, y: row * 96 });
  }
  return { positions };
};

export default function CustomLayoutDemo() {
  const [engineName, setEngineName] = useState<"default" | "snake">("default");
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
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          layoutEngine={engine}
        />
      </div>
    </div>
  );
}
