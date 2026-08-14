import { useState } from "react";
import { DagFlow, DagFlowProvider, useDAGInstance } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** fitView / fitViewOptions：首次适配 + 参数配置 + 按当前参数手动重新适配 */
export default function FitViewDemo() {
  const [padding, setPadding] = useState(40);
  const [horizontalAlign, setHorizontalAlign] = useState<"left" | "center" | "right">("center");
  const [verticalAlign, setVerticalAlign] = useState<"top" | "center" | "bottom">("center");
  const [fitEnabled, setFitEnabled] = useState(true);

  return (
    <DagFlowProvider>
      <div className="demo-scene">
        <div className="demo-controls">
          <label>
            启用首次 fitView
            <input
              type="checkbox"
              checked={fitEnabled}
              onChange={(e) => setFitEnabled(e.target.checked)}
            />
          </label>
          <label>
            padding
            <input
              type="range"
              min={0}
              max={120}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
            />
            <span className="demo-value">{padding}px</span>
          </label>
          <label>
            水平对齐
            <select
              value={horizontalAlign}
              onChange={(e) => setHorizontalAlign(e.target.value as typeof horizontalAlign)}
            >
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </label>
          <label>
            垂直对齐
            <select
              value={verticalAlign}
              onChange={(e) => setVerticalAlign(e.target.value as typeof verticalAlign)}
            >
              <option value="top">top</option>
              <option value="center">center</option>
              <option value="bottom">bottom</option>
            </select>
          </label>
          <RefitButton
            padding={padding}
            horizontalAlign={horizontalAlign}
            verticalAlign={verticalAlign}
          />
        </div>
        <div className="demo-canvas">
          <DagFlow
            defaultNodes={BASIC_NODES}
            defaultFlow={BASIC_FLOW}
            nodeTypes={nodeTypes}
            minZoom={1.5}
            maxZoom={2}
            fitView={fitEnabled}
            fitViewOptions={{ padding, horizontalAlign, verticalAlign }}
            style={{ height: 220 }}
          />
        </div>
      </div>
    </DagFlowProvider>
  );
}

function RefitButton({
  padding,
  horizontalAlign,
  verticalAlign,
}: {
  padding: number;
  horizontalAlign: "left" | "center" | "right";
  verticalAlign: "top" | "center" | "bottom";
}) {
  const dag = useDAGInstance();
  return (
    <button onClick={() => dag.fitView({ padding, horizontalAlign, verticalAlign })}>
      按当前参数适配
    </button>
  );
}
