import {
  DagFlow,
  DagFlowProvider,
  useFlow,
  useNodes,
  useNodesInitialized,
  useViewport,
} from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** DagFlowProvider 非受控：内层组件通过 hooks 读取画布状态。 */
export default function ProviderUncontrolledDemo() {
  return (
    <DagFlowProvider>
      <div className="demo-controlled">
        <div className="demo-canvas">
          <DagFlow
            defaultNodes={BASIC_NODES}
            defaultFlow={BASIC_FLOW}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 40 }}
          />
        </div>
        <aside className="demo-panel">
          <HooksSummary />
        </aside>
      </div>
    </DagFlowProvider>
  );
}

function HooksSummary() {
  const nodes = useNodes();
  const flow = useFlow();
  const viewport = useViewport();
  const nodesInitialized = useNodesInitialized();

  return (
    <>
      <h3>useNodes</h3>
      <div>{nodes.map((n) => n.id).join(", ") || "空"}</div>
      <h3>useFlow</h3>
      <div className="demo-flow-json">{JSON.stringify(flow)}</div>
      <h3>useViewport</h3>
      <div>
        x={viewport.x.toFixed(0)} y={viewport.y.toFixed(0)} zoom={viewport.zoom.toFixed(2)}
      </div>
      <h3>useNodesInitialized</h3>
      <div>{nodesInitialized ? "节点尺寸已就绪" : "正在测量节点"}</div>
    </>
  );
}
