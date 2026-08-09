import { useState } from "react";
import { DagFlow, Background } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** Background：backgroundColor / color / size / radius 点阵背景配置 */
export default function BackgroundDemo() {
  const [size, setSize] = useState(20);
  const [radius, setRadius] = useState(1);
  const [color, setColor] = useState("#1890ff33");
  const [bgColor, setBgColor] = useState("#fafafa");

  const colors = [
    { name: "蓝", value: "#1890ff33" },
    { name: "绿", value: "#52c41a33" },
    { name: "灰", value: "#e0e0e0cc" },
    { name: "红", value: "#ff4d4f33" },
  ];

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <label>
          size
          <input
            type="range"
            min={8}
            max={48}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <span className="demo-value">{size}px</span>
        </label>
        <label>
          radius
          <input
            type="range"
            min={0}
            max={4}
            step={0.5}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
          <span className="demo-value">{radius}</span>
        </label>
        {colors.map((item) => (
          <button
            key={item.value}
            className={color === item.value ? "demo-chip demo-chip--active" : "demo-chip"}
            onClick={() => setColor(item.value)}
          >
            {item.name}点
          </button>
        ))}
        <label>
          背景色
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
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
          <Background size={size} radius={radius} color={color} backgroundColor={bgColor} />
        </DagFlow>
      </div>
    </div>
  );
}
