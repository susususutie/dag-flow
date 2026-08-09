import { useState } from "react";
import { DagFlow, MiniMap } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** MiniMap：pannable / zoomable / autoShow / 尺寸配置 */
export default function MiniMapDemo() {
  const [pannable, setPannable] = useState(true);
  const [zoomable, setZoomable] = useState(true);
  const [autoShow, setAutoShow] = useState(false);
  const [size, setSize] = useState<"s" | "m" | "l">("m");

  const sizeMap = {
    s: { width: 132, height: 80 },
    m: { width: 198, height: 110 },
    l: { width: 280, height: 160 },
  };

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <label>
          pannable
          <input
            type="checkbox"
            checked={pannable}
            onChange={(e) => setPannable(e.target.checked)}
          />
        </label>
        <label>
          zoomable
          <input
            type="checkbox"
            checked={zoomable}
            onChange={(e) => setZoomable(e.target.checked)}
          />
        </label>
        <label>
          autoShow
          <input
            type="checkbox"
            checked={autoShow}
            onChange={(e) => setAutoShow(e.target.checked)}
          />
        </label>
        <label>
          尺寸
          <select value={size} onChange={(e) => setSize(e.target.value as typeof size)}>
            <option value="s">小</option>
            <option value="m">中</option>
            <option value="l">大</option>
          </select>
        </label>
      </div>
      <div className="demo-canvas">
        <DagFlow
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 40 }}
        >
          <MiniMap
            pannable={pannable}
            zoomable={zoomable}
            autoShow={autoShow}
            position="bottom-right"
            {...sizeMap[size]}
          />
        </DagFlow>
      </div>
    </div>
  );
}
