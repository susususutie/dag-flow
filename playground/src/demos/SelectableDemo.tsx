import { useState } from "react";
import { DAGCanvas, DAGProvider, useNodes } from "dag-flow";
import type { DAGNode } from "dag-flow";
import { nodeTypes } from "./shared.tsx";

/** nodesSelectable：全局节点可选中开关；单个节点通过 selectable 覆盖全局 */
export default function SelectableDemo() {
  const [selectable, setSelectable] = useState(true);

  const nodes: DAGNode[] = [
    { id: "s1", type: "status", data: { label: "可选中（继承全局）" } },
    { id: "s2", type: "status", data: { label: "selectable: false" }, selectable: false },
    { id: "s3", type: "status", data: { label: "可选中（继承全局）" } },
    { id: "s4", type: "status", data: { label: "selectable: true" }, selectable: true },
  ];
  const flow = ["s1", "s2", "s3", "s4"];

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <label>
          nodesSelectable
          <input
            type="checkbox"
            checked={selectable}
            onChange={(e) => setSelectable(e.target.checked)}
          />
        </label>
        <span>s2 声明 selectable: false，不受全局开关影响</span>
      </div>
      <div className="demo-canvas">
        <DAGProvider>
          <DAGCanvas
            nodes={nodes}
            flow={flow}
            nodeTypes={nodeTypes}
            nodesSelectable={selectable}
            fitView
            fitViewOptions={{ padding: 40 }}
          >
            <SelectedSummary />
          </DAGCanvas>
        </DAGProvider>
      </div>
    </div>
  );
}

function SelectedSummary() {
  const nodes = useNodes();
  const selected = nodes.filter((node) => node.selected);
  return (
    <div className="demo-status-bar">
      <span>选中 {selected.map((node) => node.id).join(", ") || "无"}</span>
    </div>
  );
}
