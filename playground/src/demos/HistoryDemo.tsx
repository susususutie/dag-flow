import { DagFlow, DagFlowProvider, useDAGHistory, useDAGInstance, useNodes } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** 撤销/重做历史：按钮状态和计数直接来自 useDAGHistory。 */
export default function HistoryDemo() {
  return (
    <DagFlowProvider>
      <DemoInner />
    </DagFlowProvider>
  );
}

function DemoInner() {
  const dag = useDAGInstance();
  const nodes = useNodes();
  const { canUndo, canRedo, undoCount, redoCount, undo, redo, clearHistory } = useDAGHistory();
  const lastNode = nodes.at(-1);

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <button disabled={!lastNode} onClick={() => lastNode && void dag.deleteNode(lastNode)}>
          删除末尾节点
        </button>
        <button disabled={!canUndo} onClick={undo}>
          撤销
        </button>
        <button disabled={!canRedo} onClick={redo}>
          重做
        </button>
        <button disabled={!canUndo && !canRedo} onClick={clearHistory}>
          清空历史
        </button>
        <span className="demo-value">
          撤销 {undoCount} / 重做 {redoCount} / 节点 {nodes.length}
        </span>
      </div>
      <div className="demo-canvas">
        <DagFlow
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 40 }}
        />
      </div>
    </div>
  );
}
