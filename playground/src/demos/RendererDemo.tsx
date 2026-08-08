import { DAGRenderer } from "dag-flow";
import { PARALLEL_FLOW, PARALLEL_NODES, nodeTypes } from "./shared.tsx";

/** DAGRenderer：数据驱动的独立渲染器，自带 store，无需外层 Provider */
export default function RendererDemo() {
  return (
    <div className="demo-canvas">
      <DAGRenderer
        nodes={PARALLEL_NODES}
        flow={PARALLEL_FLOW}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 40 }}
      />
    </div>
  );
}
