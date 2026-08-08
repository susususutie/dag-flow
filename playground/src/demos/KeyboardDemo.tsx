import { useState } from "react";
import { DAGCanvas, DAGProvider, useDAGInstance } from "dag-flow";
import { PARALLEL_FLOW, PARALLEL_NODES, nodeTypes } from "./shared.tsx";

/**
 * 键盘快捷键：选中节点后按
 * - Cmd/Ctrl + C 复制｜Cmd/Ctrl + V 粘贴（粘贴到选中节点之后）
 * - Cmd/Ctrl + D 复制到选中节点之后（保留节点 data/type）
 * - Delete/Backspace 删除｜Cmd/Ctrl + Z / Shift+Z 撤销 / 重做
 */
export default function KeyboardDemo() {
  return (
    <DAGProvider>
      <div className="demo-scene">
        <div className="demo-controls">
          <ActionsBar />
        </div>
        <div className="demo-canvas">
          <DAGCanvas
            defaultNodes={PARALLEL_NODES}
            defaultFlow={PARALLEL_FLOW}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 40, horizontalAlign: "left", verticalAlign: "top" }}
          />
        </div>
        <div className="demo-actions">
          <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
            选中节点后试试 ⌘C / ⌘V / ⌘D / ⌘Z / Delete；复制与粘贴会保留节点的 data 与 type
          </span>
        </div>
      </div>
    </DAGProvider>
  );
}

function ActionsBar() {
  const dag = useDAGInstance();
  const [log, setLog] = useState("");
  return (
    <>
      <button
        onClick={() => {
          const { nodes } = dag.getDAG();
          setLog(`当前节点数: ${nodes.length}`);
        }}
      >
        统计节点数
      </button>
      {log && <span className="demo-value">{log}</span>}
    </>
  );
}
