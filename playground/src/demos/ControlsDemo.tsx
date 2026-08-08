import { useState } from "react";
import { DAGCanvas, Controls } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** Controls：showZoom / zoomStep 配置 */
export default function ControlsDemo() {
  const [showZoom, setShowZoom] = useState(true);
  const [zoomStep, setZoomStep] = useState(10);

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <label>
          showZoom
          <input
            type="checkbox"
            checked={showZoom}
            onChange={(e) => setShowZoom(e.target.checked)}
          />
        </label>
        <label>
          zoomStep
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={zoomStep}
            onChange={(e) => setZoomStep(Number(e.target.value))}
          />
          <span className="demo-value">{zoomStep}%</span>
        </label>
      </div>
      <div className="demo-canvas">
        <DAGCanvas
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 40 }}
        >
          <Controls showZoom={showZoom} zoomStep={zoomStep} position="top-left" />
        </DAGCanvas>
      </div>
    </div>
  );
}
