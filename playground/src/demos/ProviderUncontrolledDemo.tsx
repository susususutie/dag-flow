import { DAGCanvas, DAGProvider, useFlow, useNode, useNodes, useViewport } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** DAGProvider 非受控：useNodes / useFlow / useViewport 读取画布状态；useNode 需在自定义节点内使用 */
export default function ProviderUncontrolledDemo() {
  return (
    <DAGProvider>
      <div className="demo-controlled">
        <div className="demo-canvas">
          <DAGCanvas
            defaultNodes={BASIC_NODES}
            defaultFlow={BASIC_FLOW}
            nodeTypes={{ ...nodeTypes, useNodeText: UseNodeTextNode }}
            fitView
            fitViewOptions={{ padding: 40 }}
          />
        </div>
        <aside className="demo-panel">
          <HooksSummary />
        </aside>
      </div>
    </DAGProvider>
  );
}

function UseNodeTextNode() {
  const { data, id } = useNode();
  const label = data?.label as string | undefined;
  return (
    <div className="demo-node" style={{ borderColor: "#1677ff" }}>
      <b>useNode 读取</b>
      <div>{label ?? id}</div>
    </div>
  );
}

function HooksSummary() {
  const nodes = useNodes();
  const flow = useFlow();
  const viewport = useViewport();

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
    </>
  );
}
