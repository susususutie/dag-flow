import { useMemo, useState } from "react";
import { computeDagEdges, DagFlow, getEdgeId } from "dag-flow";
import type { EdgeState, EdgeStates } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** 业务节点状态 → 入边状态 */
const NODE_STATES: Record<string, EdgeState> = Object.fromEntries(
  BASIC_NODES.map((node) => [node.id, (node.data?.status ?? "default") as EdgeState]),
);

const BASE_EDGE_STATES: EdgeStates = Object.fromEntries(
  computeDagEdges(BASIC_FLOW).map((edge) => [edge.id, NODE_STATES[edge.target] ?? "default"]),
);

const FINANCE_EDGES = [
  getEdgeId("start", "approve-b1"),
  getEdgeId("approve-b1", "approve-b2"),
  getEdgeId("approve-b2", "exec"),
];

/** 边状态：按目标节点状态映射；失败开关覆盖财务分支，合规校验使用自定义状态 */
export default function EdgeStatesDemo() {
  const [failed, setFailed] = useState(false);
  const edgeStates = useMemo(() => {
    const states: EdgeStates = {
      ...BASE_EDGE_STATES,
      [getEdgeId("start", "check")]: "retrying",
    };
    if (failed) {
      for (const id of FINANCE_EDGES) states[id] = "error";
    }
    return states;
  }, [failed]);

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <button type="button" onClick={() => setFailed((value) => !value)}>
          {failed ? "恢复财务分支" : "模拟财务分支失败"}
        </button>
        <span>合规校验边使用自定义状态 retrying；未映射的边回退 default</span>
      </div>
      <div className="demo-canvas">
        <DagFlow
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          edgeStates={edgeStates}
          fitView
          fitViewOptions={{ padding: 60, horizontalAlign: "left", verticalAlign: "top" }}
        />
      </div>
    </div>
  );
}
