import { useCallback, useState } from "react";
import { DagFlow, DagFlowProvider, applyNodeChanges, Flow } from "dag-flow";
import type { DAGNode, FlowModel, NodeChanges } from "dag-flow";

const NODE_POOL = ["A", "B", "C", "D", "E", "F"];

/** 节点增删改：Flow 编程式建模 + applyNodeChanges 同步数据 + updateNode/updateNodeData 修改 */
export default function NodeEditorDemo() {
  const [nodes, setNodes] = useState<DAGNode[]>(() => [{ id: "A", data: { label: "A" } }]);
  const [flow, setFlow] = useState<FlowModel>(() => new Flow(["A"]).toArray());

  const build = useCallback(
    (buildFlow: (dag: Flow) => void, labelSuffix: number) => {
      const dag = new Flow(flow);
      buildFlow(dag);
      setFlow(dag.toArray());
      const needsLabel = (id: string) =>
        !nodes.some((node) => node.id === id) && !["A", "PRE"].includes(id);
      setNodes((current) => {
        let next = current;
        for (const id of dag.getNodeIds()) {
          if (!current.some((node) => node.id === id)) {
            next = [...next, { id, data: { label: needsLabel(id) ? `${id}${labelSuffix}` : id } }];
          }
        }
        return next;
      });
    },
    [flow, nodes],
  );

  const addSerial = useCallback(() => {
    const id = NODE_POOL[Math.floor(Math.random() * NODE_POOL.length)];
    build((dag) => {
      dag.addAfter("A", id);
    }, 1);
  }, [build]);

  const addParallelBranch = useCallback(() => {
    const id = NODE_POOL[Math.floor(Math.random() * NODE_POOL.length)];
    build((dag) => {
      dag.addParallelAfter("A", id);
    }, 2);
  }, [build]);

  const addStepsBefore = useCallback(() => {
    build((dag) => {
      dag.addStepsBefore("A", "PRE");
    }, 0);
  }, [build]);

  const removeSelected = useCallback(() => {
    const selected = nodes.filter((node) => node.selected).map((node) => node.id);
    if (selected.length === 0) return;
    const dag = new Flow(flow);
    dag.removeNodes(...selected);
    setFlow(dag.toArray());
    setNodes((current) => current.filter((node) => !selected.includes(node.id)));
  }, [flow, nodes]);

  const renameFirst = useCallback(() => {
    setNodes((current) =>
      current.map((node) =>
        node.id === "A"
          ? { ...node, data: { ...node.data, label: `A·${Date.now() % 1000}` } }
          : node,
      ),
    );
  }, []);

  const selectFirst = useCallback(() => {
    const changes: NodeChanges = [{ type: "select", id: "A", selected: true }];
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onNodesChange = useCallback((changes: NodeChanges) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onFlowChange = useCallback((nextFlow: FlowModel) => {
    setFlow(nextFlow);
  }, []);

  return (
    <DagFlowProvider>
      <div className="demo-canvas">
        <DagFlow
          nodes={nodes}
          flow={flow}
          onNodesChange={onNodesChange}
          onFlowChange={onFlowChange}
          fitView
          fitViewOptions={{ padding: 40 }}
        />
        <div className="demo-status-bar">
          <span>节点 {nodes.map((n) => n.id).join(", ")}</span>
        </div>
      </div>
      <div className="demo-actions">
        <button onClick={addSerial}>A 后追加串行节点</button>
        <button onClick={addParallelBranch}>A 后追加并行分支</button>
        <button onClick={addStepsBefore}>顶部插入步骤</button>
        <button onClick={selectFirst}>选中 A</button>
        <button onClick={renameFirst}>重命名 A</button>
        <button onClick={removeSelected}>删除选中</button>
      </div>
    </DagFlowProvider>
  );
}
