import { useCallback, useState } from "react";
import { DAGCanvas } from "dag-flow";
import type { DAGNode } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** 交互事件回调：onNodeClick / onPaneClick / onSelectionChange */
export default function InteractionDemo() {
  const [logs, setLogs] = useState<string[]>([]);

  const record = useCallback((message: string) => {
    setLogs((prev) => [message, ...prev].slice(0, 8));
  }, []);

  return (
    <div className="demo-controlled">
      <div className="demo-canvas">
        <DAGCanvas
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 40 }}
          onNodeClick={(_event, node: DAGNode) => record(`节点点击: ${node.id}`)}
          onPaneClick={() => record("空白区域点击（并清空选中）")}
          onSelectionChange={({ nodes }) =>
            record(`选中变化: ${nodes.length === 0 ? "无" : nodes.map((n) => n.id).join(",")}`)
          }
        />
      </div>
      <aside className="demo-panel">
        <h3>交互日志</h3>
        <ul className="demo-log">
          {logs.map((log, index) => (
            <li key={`${index}-${log}`}>{log}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
