import { useState } from "react";
import { DAGCanvas, Flow } from "dag-flow";
import type { LayoutEngine, XYPosition } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** 蛇形布局引擎：按拓扑顺序每行 4 个节点折行（消费 config.hGap/vGap） */
const snakeEngine: LayoutEngine = (flow, { pinned, config }) => {
  const ids = new Flow(flow).getNodeIds();
  const positions = new Map<string, XYPosition>();
  const COLS = 4;
  let index = 0;
  for (const id of ids) {
    if (pinned.has(id)) continue;
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    positions.set(id, {
      x: col * (150 + config.hGap),
      y: row * (40 + config.vGap),
    });
    index += 1;
  }
  return positions;
};

/** 自定义布局引擎：layoutEngine 替换默认列式路由 */
export default function CustomLayoutDemo() {
  const [engine, setEngine] = useState<"default" | "snake">("default");

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <button
          className={engine === "default" ? "demo-chip demo-chip--active" : "demo-chip"}
          onClick={() => setEngine("default")}
        >
          默认列式布局
        </button>
        <button
          className={engine === "snake" ? "demo-chip demo-chip--active" : "demo-chip"}
          onClick={() => setEngine("snake")}
        >
          自定义蛇形布局
        </button>
        <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
          拖动节点焊死位置后，换引擎不覆盖已固定节点
        </span>
      </div>
      <div className="demo-canvas">
        <DAGCanvas
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          layoutEngine={engine === "snake" ? snakeEngine : undefined}
          fitView
          fitViewOptions={{ padding: 40, horizontalAlign: "left", verticalAlign: "top" }}
        />
      </div>
    </div>
  );
}
