import { useMemo, useState } from "react";
import { createDefaultLayoutEngine, DagFlow } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

export default function GapDemo() {
  const [hGap, setHGap] = useState(160);
  const [vGap, setVGap] = useState(16);
  const engine = useMemo(() => createDefaultLayoutEngine({ hGap, vGap }), [hGap, vGap]);

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
            onChange={(event) => setHGap(Number(event.target.value))}
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
            onChange={(event) => setVGap(Number(event.target.value))}
          />
          <span className="demo-value">{vGap}px</span>
        </label>
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
