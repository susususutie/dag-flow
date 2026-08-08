import { useCallback, useState } from "react";
import { DAGCanvas, DAGProvider, useDAGState } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** DAGProvider 受控：useDAGState 提供 nodes/flow 与可直接传入 DAGCanvas 的变更回调 */
export default function ProviderDemo() {
  return (
    <DAGProvider>
      <Scene />
    </DAGProvider>
  );
}

function Scene() {
  const { nodes, flow, onNodesChange, onFlowChange, setNodes, setFlow } = useDAGState({
    nodes: BASIC_NODES,
    flow: BASIC_FLOW,
  });
  const [logs, setLogs] = useState<string[]>([]);

  const record = useCallback((message: string) => {
    setLogs((prev) => [message, ...prev].slice(0, 6));
  }, []);

  const addNode = useCallback(() => {
    const id = `extra-${Date.now() % 10000}`;
    setNodes((current) => [...current, { id, data: { label: id } }]);
    setFlow((current) => [...current, id]);
    record(`setNodes / setFlow 追加 ${id}`);
  }, [record, setFlow, setNodes]);

  const reset = useCallback(() => {
    setNodes(BASIC_NODES);
    setFlow(BASIC_FLOW);
    record("setDAG 重置为初始数据");
  }, [record, setFlow, setNodes]);

  return (
    <div className="demo-controlled">
      <div className="demo-canvas">
        <DAGCanvas
          nodes={nodes}
          flow={flow}
          nodeTypes={nodeTypes}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            record(`onNodesChange: ${changes.length} 条`);
          }}
          onFlowChange={(nextFlow) => {
            onFlowChange(nextFlow);
            record("onFlowChange");
          }}
          fitView
          fitViewOptions={{ padding: 40 }}
        />
      </div>
      <aside className="demo-panel">
        <h3>useDAGState 操作</h3>
        <button onClick={addNode}>追加节点</button>
        <button onClick={reset}>重置数据</button>
        <h3>当前拓扑</h3>
        <div className="demo-flow-json">{JSON.stringify(flow)}</div>
        <h3>日志</h3>
        <ul className="demo-log">
          {logs.map((log, index) => (
            <li key={`${index}-${log}`}>{log}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
