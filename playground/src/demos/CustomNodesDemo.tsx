import { DagFlow, DagFlowProvider } from "dag-flow";
import { StatusNode, STATUS_COLORS } from "./shared.tsx";
import type { StatusNodeProps } from "./shared.tsx";

/** 自定义节点：nodeTypes 注册多种节点组件，按节点 type 字段分发 */

function CardNode(
  props: StatusNodeProps & { data?: { label?: string; desc?: string; status?: string } },
) {
  const status = props.data?.status ?? "default";
  return (
    <div className="demo-card-node" style={{ borderColor: STATUS_COLORS[status] ?? "#d9d9d9" }}>
      <div className="demo-card-title">{props.data?.label ?? props.id}</div>
      <div className="demo-card-desc">{props.data?.desc}</div>
    </div>
  );
}

function IconNode(props: StatusNodeProps) {
  return (
    <div
      className="demo-icon-node"
      style={
        props.selected
          ? { borderColor: "#1677ff", boxShadow: "0 0 0 2px rgba(22,119,255,0.2)" }
          : undefined
      }
    >
      <span className="demo-icon-node-symbol">◆</span>
      <span>{props.data?.label ?? props.id}</span>
    </div>
  );
}

const nodeTypes = {
  status: StatusNode,
  card: CardNode,
  icon: IconNode,
};

const NODES = [
  {
    id: "request",
    type: "card",
    data: { label: "提交申请", desc: "填写申请信息并提交", status: "processing" },
  },
  { id: "approve", type: "status", data: { label: "审批", status: "warning" } },
  { id: "review-1", type: "icon", data: { label: "审核一" } },
  { id: "review-2", type: "icon", data: { label: "审核二" } },
  { id: "finish", type: "card", data: { label: "完成", desc: "流程结束归档", status: "success" } },
];

export default function CustomNodesDemo() {
  return (
    <DagFlowProvider>
      <div className="demo-canvas">
        <DagFlow
          nodes={NODES}
          flow={["request", [["approve"], ["review-1", "review-2"]], "finish"]}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 40 }}
        />
      </div>
    </DagFlowProvider>
  );
}
