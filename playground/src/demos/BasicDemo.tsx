import { Background, Controls, DagFlow, MiniMap } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** 基础画布：非受控模式 + 自定义节点 + 附加组件全量挂载 */
export default function BasicDemo() {
  return (
    <DagFlow
      defaultNodes={BASIC_NODES}
      defaultFlow={BASIC_FLOW}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 40 }}
    >
      <Background />
      <Controls />
      <MiniMap />
    </DagFlow>
  );
}
