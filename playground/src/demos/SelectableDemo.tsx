import { useState } from "react";
import { DagFlow, DagFlowProvider, useNodes } from "dag-flow";
import type { DAGNode } from "dag-flow";
import { nodeTypes } from "./shared.tsx";

/** 节点交互配置：全局开关与单节点 selectable / draggable 覆盖。 */
export default function SelectableDemo() {
  const [selectable, setSelectable] = useState(true);
  const [draggable, setDraggable] = useState(true);

  const nodes: DAGNode[] = [
    { id: "s1", type: "status", data: { label: "继承全局配置" } },
    {
      id: "s2",
      type: "status",
      data: { label: "禁止选择与拖动" },
      selectable: false,
      draggable: false,
    },
    {
      id: "s3",
      type: "status",
      data: { label: "始终允许选择与拖动" },
      selectable: true,
      draggable: true,
    },
  ];
  const flow = ["s1", "s2", "s3"];

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
        <label>
          nodesDraggable
          <input
            type="checkbox"
            checked={draggable}
            onChange={(event) => setDraggable(event.target.checked)}
          />
        </label>
        <span>s2 显式禁用，s3 显式启用</span>
      </div>
      <div className="demo-canvas">
        <DagFlowProvider>
          <DagFlow
            nodes={nodes}
            flow={flow}
            nodeTypes={nodeTypes}
            nodesSelectable={selectable}
            nodesDraggable={draggable}
            fitView
            fitViewOptions={{ padding: 40 }}
          >
            <SelectedSummary />
          </DagFlow>
        </DagFlowProvider>
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
