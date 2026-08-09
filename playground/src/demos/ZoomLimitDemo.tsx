import { useState } from "react";
import { DagFlow } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** minZoom / maxZoom：缩放边界钳制，滚轮缩放与 zoomIn/zoomOut 均不超过范围 */
export default function ZoomLimitDemo() {
  const [minZoom, setMinZoom] = useState(0.5);
  const [maxZoom, setMaxZoom] = useState(2);

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <label>
          minZoom
          <input
            type="range"
            min={0.1}
            max={4}
            step={0.1}
            value={minZoom}
            onChange={(e) => setMinZoom(Number(e.target.value))}
          />
          <span className="demo-value">{minZoom.toFixed(1)}</span>
        </label>
        <label>
          maxZoom
          <input
            type="range"
            min={0.1}
            max={4}
            step={0.1}
            value={maxZoom}
            onChange={(e) => setMaxZoom(Number(e.target.value))}
          />
          <span className="demo-value">{maxZoom.toFixed(1)}</span>
        </label>
        <span>
          滚轮缩放超出范围时被钳制在 [{minZoom.toFixed(1)}, {maxZoom.toFixed(1)}]
        </span>
      </div>
      <div className="demo-canvas">
        <DagFlow
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          minZoom={minZoom}
          maxZoom={maxZoom}
          fitView
          fitViewOptions={{ padding: 40 }}
        />
      </div>
    </div>
  );
}
