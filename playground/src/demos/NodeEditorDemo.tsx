import { useCallback, useRef } from "react";
import { DagFlow, Flow, useDAGState } from "dag-flow";

/** 节点增删改：Flow 编程式建模 + useDAGState 原子维护 nodes/flow */
export default function NodeEditorDemo() {
  const { nodes, flow, setDAG, onNodesChange, onFlowChange } = useDAGState({
    nodes: [{ id: "A", data: { label: "A" } }],
    flow: new Flow(["A"]).toArray(),
  });
  const nextNodeNumber = useRef(1);
  const renameNumber = useRef(1);

  const build = useCallback(
    (buildFlow: (dag: Flow) => void) => {
      setDAG((current) => {
        const dag = new Flow(current.flow);
        buildFlow(dag);
        let nextNodes = current.nodes;
        for (const id of dag.getNodeIds()) {
          if (!current.nodes.some((node) => node.id === id)) {
            nextNodes = [...nextNodes, { id, data: { label: id } }];
          }
        }
        return { nodes: nextNodes, flow: dag.toArray() };
      });
    },
    [setDAG],
  );

  const addSerial = useCallback(() => {
    const id = `N${nextNodeNumber.current++}`;
    build((dag) => {
      dag.addAfter("A", id);
    });
  }, [build]);

  const addParallelBranch = useCallback(() => {
    const id = `N${nextNodeNumber.current++}`;
    build((dag) => {
      dag.addParallelAfter("A", id);
    });
  }, [build]);

  const addStepsBefore = useCallback(() => {
    build((dag) => {
      dag.addStepsBefore("A", "PRE");
    });
  }, [build]);

  const removeSelected = useCallback(() => {
    setDAG((current) => {
      const selected = current.nodes.filter((node) => node.selected).map((node) => node.id);
      if (selected.length === 0) return current;
      const dag = new Flow(current.flow);
      dag.removeNodes(...selected);
      return {
        nodes: current.nodes.filter((node) => !selected.includes(node.id)),
        flow: dag.toArray(),
      };
    });
  }, [setDAG]);

  const renameFirst = useCallback(() => {
    const label = `A·${renameNumber.current++}`;
    setDAG((current) => ({
      ...current,
      nodes: current.nodes.map((node) =>
        node.id === "A" ? { ...node, data: { ...node.data, label } } : node,
      ),
    }));
  }, [setDAG]);

  const selectFirst = useCallback(() => {
    onNodesChange([{ type: "select", id: "A", selected: true }]);
  }, [onNodesChange]);

  return (
    <>
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
    </>
  );
}
