import { useState } from "react";
import { DAGCanvas } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** hGap / vGap：节点水平与垂直间距实时调节 */
export default function GapDemo() {
  const [hGap, setHGap] = useState(160);
  const [vGap, setVGap] = useState(16);

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <label>
          hGap
          <input
            type="range"
            min={8}
            max={300}
            value={hGap}
            onChange={(e) => setHGap(Number(e.target.value))}
          />
          <span className="demo-value">{hGap}px</span>
        </label>
        <label>
          vGap
          <input
            type="range"
            min={4}
            max={80}
            value={vGap}
            onChange={(e) => setVGap(Number(e.target.value))}
          />
          <span className="demo-value">{vGap}px</span>
        </label>
      </div>
      <div className="demo-canvas">
        <DAGCanvas
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          hGap={hGap}
          vGap={vGap}
          fitView
          fitViewOptions={{ padding: 40, horizontalAlign: "left", verticalAlign: "top" }}
        />
      </div>
    </div>
  );
}
