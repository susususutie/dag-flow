import {
  Background,
  Controls,
  DagFlow,
  DagFlowProvider,
  Flow,
  MiniMap,
  NodeToolbar,
  Position,
  useDAGInstance,
  useDAGState,
  useFlow,
  type NodeProps,
} from "dag-flow";
import { useEffect, useState } from "react";

function StartNode(props: NodeProps) {
  return props.data.label;
}

function ProcessNode(props: NodeProps<{ label: string; description?: string }>) {
  const { label, description } = props.data;
  const flow = useFlow();
  const inParallel = new Flow(flow).isInParallelGroup(props.id);
  const { setDAG, selectNode, deleteNode } = useDAGInstance();

  const addNode = (build: (dag: Flow, newId: string) => void) => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const newId = `node-${suffix}`;
    setDAG((current) => {
      const dag = new Flow(current.flow);
      build(dag, newId);
      return {
        nodes: [
          ...current.nodes,
          { id: newId, type: "process", data: { label: `新节点-${suffix}` } },
        ],
        flow: dag.toArray(),
      };
    });
    selectNode(newId);
  };

  const addBefore = () => addNode((dag, newId) => dag.addBefore(props.id, newId));
  const addAfter = () => addNode((dag, newId) => dag.addAfter(props.id, newId));
  const addParallelUp = () => addNode((dag, newId) => dag.addParallelBefore(props.id, newId));
  const addParallelDown = () => addNode((dag, newId) => dag.addParallelAfter(props.id, newId));

  return (
    <>
      <NodeToolbar position={Position.Top}>
        <div className="process-node-toolbar">
          <button onClick={addParallelUp} title="往上新增并行节点" aria-label="往上新增并行节点">
            +
          </button>
          <button onClick={() => deleteNode(props.id)} title="删除节点" aria-label="删除节点">
            x
          </button>
        </div>
      </NodeToolbar>
      <NodeToolbar position={Position.Left}>
        <button onClick={addBefore} title="新增前置节点" aria-label="新增前置节点">
          +
        </button>
      </NodeToolbar>
      <NodeToolbar position={Position.Right}>
        <button onClick={addAfter} title="新增后置节点" aria-label="新增后置节点">
          +
        </button>
      </NodeToolbar>
      <NodeToolbar position={Position.Bottom}>
        <button onClick={addParallelDown} title="往下新增并行节点" aria-label="往下新增并行节点">
          +
        </button>
      </NodeToolbar>
      <div>
        <div>{label}</div>
        <div>{description}</div>
        {!inParallel && <span className="process-node-badge">主干</span>}
      </div>
    </>
  );
}

const NODE_TYPES = {
  start: StartNode,
  end: StartNode,
  process: ProcessNode,
};

function FlowEditor() {
  const [loading, setLoading] = useState(true);
  const { nodes, flow, onNodesChange, onFlowChange, setDAG } = useDAGState();
  useEffect(() => {
    // 模拟 异步加载流程数据
    const init = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setDAG({
        nodes: [
          { id: "Start", type: "start", data: { label: "开始" } },
          { id: "A", type: "process", data: { label: "导入", description: "导入数据" } },
          { id: "B1", type: "process", data: { label: "财务审核" } },
          { id: "B2-1", type: "process", data: { label: "人力资源审核" } },
          { id: "B2-2", type: "process", data: { label: "人力总监审核" } },
          { id: "B3", type: "process", data: { label: "技术审核" } },
          { id: "C", type: "process", data: { label: "CEO拍板" } },
          { id: "End", type: "end", data: { label: "结束" } },
        ],
        flow: ["Start", "A", [["B1"], ["B2-1", "B2-2"], ["B3"]], "C", "End"],
      });
      setLoading(false);
    };
    void init();
  }, []);

  if (loading) {
    return null;
  }
  return (
    <DagFlow
      nodes={nodes}
      flow={flow}
      onNodesChange={onNodesChange}
      onFlowChange={onFlowChange}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 40 }}
      nodesDraggable={false}
    >
      <Background />
      <Controls />
      <MiniMap />
    </DagFlow>
  );
}

/** 复杂流程编辑器：受控模式 + 自定义节点 + 附加组件全量挂载 */
export default function FlowEditorDemo() {
  return (
    <DagFlowProvider>
      <style>
        {`
        .dag-flow {
          
        }
        .dag-flow__node-start, .dag-flow__node-end {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background-color: #fff;
          color: #333;
          text-align: center;
          border: 1px solid #ededed;
          font-size: 13px;
          &.selectable {
            &:hover {
              outline: none;
              border: 1px solid #bbb;
              box-shadow: 0 0 0 0.5px #1a192b;
            }
          }
        }
        .dag-flow__node-process {
          display: flex;
          flex-direction: column;
          padding: 4px 10px;
          border-radius: 8px;
          background-color: #fff;
          color: #333;
          text-align: center;
          border: 1px solid #ededed;
          &.selectable {
            &:hover {
              outline: none;
              border: 1px solid #bbb;
              box-shadow: 0 0 0 0.5px #1a192b;
            }
          }
        }
        .process-node-toolbar {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
        }
        .process-node-badge {
          position: absolute;
          top: -8px;
          right: -6px;
          padding: 0 4px;
          border-radius: 6px;
          background-color: #1677ff;
          color: #fff;
          font-size: 10px;
          line-height: 14px;
        }
        `}
      </style>
      <FlowEditor />
    </DagFlowProvider>
  );
}
