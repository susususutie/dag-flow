import { NodeToolbar, Position, useDAGInstance, useNodesInitialized } from "dag-flow";
import { useEffect, useRef } from "react";
import type { DAGData, DAGNode, FlowModel, LayoutEngine } from "dag-flow";

/** 状态节点徽标色板 */
export const STATUS_COLORS: Record<string, string> = {
  success: "#52c41a",
  error: "#ff4d4f",
  warning: "#faad14",
  processing: "#1677ff",
};

export interface StatusNodeProps {
  id: string;
  data?: { label?: string; status?: keyof typeof STATUS_COLORS };
  selectable?: boolean;
  selected?: boolean;
}

/** 自定义节点：状态徽标 + 标签 */
export function StatusNode(props: StatusNodeProps) {
  const { id, data, selectable, selected } = props;
  const status = data?.status ?? "default";
  return (
    <>
      <NodeToolbar position={Position.Top} style={{ display: "flex", gap: 4 }}>
        <button type="button" onClick={(event) => event.stopPropagation()}>
          编辑
        </button>
        <button type="button" onClick={(event) => event.stopPropagation()}>
          删除
        </button>
      </NodeToolbar>
      <div
        className={[
          "demo-status-node",
          selectable ? "demo-status-node--selectable" : "",
          selected ? "demo-status-node--selected" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          className="demo-status-dot"
          style={{ backgroundColor: STATUS_COLORS[status] ?? "#d9d9d9" }}
        />
        <span>{data?.label ?? id}</span>
      </div>
    </>
  );
}

export function LayoutRunner({
  engine,
  nodes,
  setDAG,
}: {
  engine?: LayoutEngine;
  nodes: DAGNode[];
  setDAG: (value: DAGData) => void;
}) {
  const instance = useDAGInstance();
  const initialized = useNodesInitialized();
  const pendingFitNodes = useRef<DAGNode[] | null>(null);

  useEffect(() => {
    if (!initialized) return;
    let active = true;
    void instance.layout({ engine }).then((nextDAG) => {
      if (!active) return;
      pendingFitNodes.current = nextDAG.nodes;
      setDAG(nextDAG);
    });
    return () => {
      active = false;
    };
  }, [engine, initialized, instance, setDAG]);

  useEffect(() => {
    if (pendingFitNodes.current !== nodes) return;
    pendingFitNodes.current = null;
    instance.fitView({ padding: 40 });
  }, [instance, nodes]);

  return null;
}

/** 基础拓扑：入口 → 三路并行 → 汇合 → 串行收尾 */
export const BASIC_NODES: DAGNode[] = [
  {
    id: "start",
    position: { x: 0, y: 56 },
    data: { label: "发起申请", status: "processing" },
  },
  {
    id: "approve-a",
    type: "status",
    position: { x: 310, y: 0 },
    data: { label: "部门审批", status: "warning" },
  },
  {
    id: "approve-b1",
    type: "status",
    position: { x: 310, y: 56 },
    data: { label: "财务初审", status: "success" },
  },
  {
    id: "approve-b2",
    type: "status",
    position: { x: 620, y: 56 },
    data: { label: "财务复审", status: "success" },
  },
  {
    id: "check",
    type: "status",
    position: { x: 310, y: 112 },
    data: { label: "合规校验", status: "processing" },
  },
  {
    id: "exec",
    type: "status",
    position: { x: 930, y: 56 },
    data: { label: "执行计划", status: "default" },
  },
  {
    id: "archive",
    position: { x: 1240, y: 56 },
    data: { label: "归档", status: "default" },
  },
];

export const BASIC_FLOW: FlowModel = [
  "start",
  [["approve-a"], ["approve-b1", "approve-b2"], ["check"]],
  "exec",
  "archive",
];

/** 并行密集拓扑：四路并行，其中两路含组内串行 */
export const PARALLEL_NODES: DAGNode[] = [
  {
    id: "p1",
    // type: "status",
    position: { x: 0, y: 84 },
    data: { label: "步骤 1", status: "processing" },
  },
  {
    id: "p2-1",
    // type: "status",
    position: { x: 310, y: 0 },
    data: { label: "分支 2-1", status: "default" },
  },
  {
    id: "p2-2",
    // type: "status",
    position: { x: 620, y: 0 },
    data: { label: "分支 2-2", status: "success" },
  },
  {
    id: "p3",
    // type: "status",
    position: { x: 310, y: 56 },
    data: { label: "分支 3", status: "default" },
  },
  {
    id: "p4-1",
    // type: "status",
    position: { x: 310, y: 112 },
    data: { label: "分支 4-1", status: "default" },
  },
  {
    id: "p4-2",
    // type: "status",
    position: { x: 620, y: 112 },
    data: { label: "分支 4-2", status: "warning" },
  },
  {
    id: "p5",
    // type: "status",
    position: { x: 310, y: 168 },
    data: { label: "分支 5", status: "default" },
  },
  {
    id: "done",
    type: "status",
    position: { x: 930, y: 84 },
    data: { label: "完成", status: "success" },
  },
];

export const PARALLEL_FLOW: FlowModel = [
  "p1",
  [["p2-1", "p2-2"], ["p3"], ["p4-1", "p4-2"], ["p5"]],
  "done",
];

export const nodeTypes = { status: StatusNode };

/** 变更日志面板 */
export function LogPanel({ logs }: { logs: string[] }) {
  if (logs.length === 0) return null;
  return (
    <ul className="demo-log">
      {logs.map((log, index) => (
        <li key={`${index}-${log}`}>{log}</li>
      ))}
    </ul>
  );
}
