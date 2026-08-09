import { useCallback, useState } from "react";
import { DagFlow } from "dag-flow";
import type { FlowModel, NodeChanges } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

const CHANGE_TEXT: Record<NodeChanges[number]["type"], string> = {
  add: "新增节点",
  remove: "移除节点",
  replace: "更新节点",
  select: "选中变化",
  position: "位置变化",
  dimensions: "尺寸变化",
};

/** 非受控模式：数据由画布内部维护，回调仅接收变更通知 */
export default function UncontrolledDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [flowText, setFlowText] = useState("");

  const record = useCallback((message: string) => {
    setLogs((prev) => [message, ...prev].slice(0, 8));
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChanges) => {
      for (const change of changes) {
        record(`${CHANGE_TEXT[change.type]}: ${"id" in change ? change.id : "?"}`);
      }
    },
    [record],
  );

  const onFlowChange = useCallback(
    (flow: FlowModel, meta: { reason: "insert" | "remove" | "update" }) => {
      record(`拓扑变更: ${meta.reason}`);
      setFlowText(JSON.stringify(flow));
    },
    [record],
  );

  return (
    <div className="demo-controlled">
      <div className="demo-canvas">
        <DagFlow
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 40 }}
          onNodesChange={onNodesChange}
          onFlowChange={onFlowChange}
        />
      </div>
      <aside className="demo-panel">
        <h3>说明</h3>
        <p>
          通过 defaultNodes / defaultFlow 初始化；内部操作经 onNodesChange / onFlowChange 回传通知。
        </p>
        {flowText && (
          <>
            <h3>当前拓扑</h3>
            <div className="demo-flow-json">{flowText}</div>
          </>
        )}
        <h3>变更日志</h3>
        <ul className="demo-log">
          {logs.map((log, index) => (
            <li key={`${index}-${log}`}>{log}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
