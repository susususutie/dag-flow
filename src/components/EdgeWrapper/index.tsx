import { memo } from "react";
import type { EdgeState } from "../../types/index.ts";
import type { FlowEdgeGeometry } from "../../utils/edges/flowPath.ts";
import { getRoundedPath } from "../../utils/edges/paths.ts";

interface EdgeWrapperProps {
  edge: FlowEdgeGeometry;
  state?: EdgeState;
}

/** 单条逻辑边：完整 path 携带边 id 与状态，供 CSS 独立覆盖。 */
function EdgeWrapper({ edge, state = "default" }: EdgeWrapperProps) {
  return (
    <g className="dag-flow__edge" data-edge-id={edge.id} data-edge-state={state}>
      <path className="dag-flow__edge-path" d={getRoundedPath(edge.points)} />
    </g>
  );
}

export default memo(EdgeWrapper);
