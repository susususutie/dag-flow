import { useState } from "react";
import { DAGCanvas } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

const LINE_COLORS = [
  { name: "默认灰", value: "#d9d9d9" },
  { name: "蓝色", value: "#1677ff" },
  { name: "绿色", value: "#52c41a" },
  { name: "红色", value: "#ff4d4f" },
  { name: "橙色", value: "#fa8c16" },
];

/** lineWidth / lineColor：连线粗细与颜色实时调节 */
export default function LineStyleDemo() {
  const [lineWidth, setLineWidth] = useState(2);
  const [lineColor, setLineColor] = useState(LINE_COLORS[0].value);

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <label>
          lineWidth
          <input
            type="range"
            min={1}
            max={8}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
          <span className="demo-value">{lineWidth}px</span>
        </label>
        {LINE_COLORS.map((item) => (
          <button
            key={item.value}
            className={lineColor === item.value ? "demo-chip demo-chip--active" : "demo-chip"}
            onClick={() => setLineColor(item.value)}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 0,
                borderTop: `2px solid ${item.value}`,
                borderRadius: 1,
              }}
            />
            {item.name}
          </button>
        ))}
      </div>
      <div className="demo-canvas">
        <DAGCanvas
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          lineWidth={lineWidth}
          lineColor={lineColor}
          fitView
          fitViewOptions={{ padding: 60, horizontalAlign: "left", verticalAlign: "top" }}
        />
      </div>
    </div>
  );
}
