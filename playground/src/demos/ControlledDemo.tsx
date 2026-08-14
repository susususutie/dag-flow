import { useCallback, useMemo, useState } from "react";
import { DagFlow, Background, Controls, MiniMap, applyNodeChanges } from "dag-flow";
import type { DAGNode, FlowModel, NodeChanges, OnBeforeDeleteResult } from "dag-flow";

const INITIAL_NODES: DAGNode[] = [
  { id: "a", data: { label: "步骤 A" } },
  { id: "b1", data: { label: "步骤 B1" } },
  { id: "b2", data: { label: "步骤 B2" } },
  { id: "c", data: { label: "步骤 C" } },
];

const INITIAL_FLOW: FlowModel = ["a", [["b1"], ["b2"]], "c"];

const CHANGE_TEXT: Record<NodeChanges[number]["type"], string> = {
  add: "新增节点",
  remove: "移除节点",
  replace: "更新节点",
  select: "选中变化",
  position: "位置变化",
  dimensions: "尺寸变化",
};

/** 受控模式：数据与 onChange 回调均来自外部状态，用于接入业务表单/编辑态 */
export default function ControlledDemo() {
  const [nodes, setNodes] = useState<DAGNode[]>(INITIAL_NODES);
  const [flow, setFlow] = useState<FlowModel>(INITIAL_FLOW);
  const [logs, setLogs] = useState<string[]>([]);
  const [beforeDelete, setBeforeDelete] = useState(true);

  const record = useCallback((message: string) => {
    setLogs((prev) => [message, ...prev].slice(0, 8));
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChanges) => {
      for (const change of changes) {
        record(`${CHANGE_TEXT[change.type]}: ${"id" in change ? change.id : "?"}`);
      }
      setNodes((current) => applyNodeChanges(changes, current));
    },
    [record],
  );

  const onFlowChange = useCallback(
    (_flow: FlowModel, meta: { reason: "insert" | "remove" | "update" }) => {
      record(`拓扑变更: ${meta.reason}`);
      setFlow(_flow);
    },
    [record],
  );

  const onBeforeDelete = useCallback(
    ({ nodes: requested }: { nodes: DAGNode[] }): OnBeforeDeleteResult => {
      record(`删除确认: ${requested.map((node) => node.id).join(",")}`);
      return beforeDelete;
    },
    [beforeDelete, record],
  );

  const flowSummary = useMemo(() => JSON.stringify(flow), [flow]);

  return (
    <div className="demo-controlled">
      <div className="demo-canvas">
        <DagFlow
          nodes={nodes}
          flow={flow}
          onNodesChange={onNodesChange}
          onFlowChange={onFlowChange}
          onBeforeDelete={onBeforeDelete}
          fitView
          fitViewOptions={{ padding: 40 }}
          onPaneClick={() => record("点击空白区域")}
          onMove={(_event, viewport) => {
            void viewport;
          }}
        >
          <Background size={20} />
          <Controls />
          <MiniMap />
        </DagFlow>
      </div>
      <aside className="demo-panel">
        <h3>受控数据</h3>
        <label className="demo-toggle">
          <input
            type="checkbox"
            checked={beforeDelete}
            onChange={(event) => setBeforeDelete(event.target.checked)}
          />
          允许删除（onBeforeDelete 返回 false 时阻止）
        </label>
        <div className="demo-flow-json">{flowSummary}</div>
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
