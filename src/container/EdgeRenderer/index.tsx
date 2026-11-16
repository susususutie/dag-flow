import { memo, useMemo } from "react";
import EdgeWrapper from "../../components/EdgeWrapper/index.tsx";
import useCanvasStore from "../../hooks/useCanvasStore.ts";
import useFlow from "../../hooks/useFlow.ts";
import { Position } from "../../types/index.ts";
import type { EdgeState, EdgeStates } from "../../types/index.ts";
import { getFlowEdgeGeometries } from "../../utils/edges/flowPath.ts";
import { getRoundedPath, getSmoothStepPath } from "../../utils/edges/paths.ts";
import { getSourcePoint } from "../../utils/edges/points.ts";

const DEFAULT_DIMENSIONS = { width: 150, height: 40 };

function ConnectionLine() {
  const connectingEdge = useCanvasStore((state) => state.connectingEdge);
  const source = useCanvasStore((state) =>
    state.connectingEdge ? state.nodeMap.get(state.connectingEdge.source) : undefined,
  );
  const dimensions = useCanvasStore((state) =>
    state.connectingEdge
      ? (state.nodeDimensions.get(state.connectingEdge.source) ?? DEFAULT_DIMENSIONS)
      : DEFAULT_DIMENSIONS,
  );
  const direction = useCanvasStore((state) => state.direction);
  if (!connectingEdge || !source?.position) return null;

  const sourcePosition = direction === "horizontal" ? Position.Right : Position.Bottom;
  const targetPosition = direction === "horizontal" ? Position.Left : Position.Top;
  const sourcePoint = getSourcePoint(direction, source.position, dimensions);
  const [path] = getSmoothStepPath({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    sourcePosition,
    targetX: connectingEdge.position.x,
    targetY: connectingEdge.position.y,
    targetPosition,
  });
  return <path className="dag-flow__edge-path dag-flow__edge-path--connecting" d={path} />;
}

/** 共享段重叠时后绘制的可见：error 压在普通状态上，default 最后保持主干中性。 */
function drawPriority(state: EdgeState): number {
  if (state === "default") return 2;
  if (state === "error") return 1;
  return 0;
}

function EdgeRenderer({ edgeStates }: { edgeStates?: EdgeStates }) {
  const flow = useFlow();
  const nodeMap = useCanvasStore((state) => state.nodeMap);
  const nodeDimensions = useCanvasStore((state) => state.nodeDimensions);
  const direction = useCanvasStore((state) => state.direction);
  const geometry = useMemo(
    () => getFlowEdgeGeometries(flow, nodeMap, nodeDimensions, direction),
    [direction, flow, nodeDimensions, nodeMap],
  );
  const structuralPath = useMemo(
    () => geometry.structural.map((points) => getRoundedPath(points)).join(" "),
    [geometry],
  );
  const interactionPath = useMemo(
    () =>
      [...geometry.structural, ...geometry.edges.map((edge) => edge.points)]
        .map((points) => getRoundedPath(points))
        .join(" "),
    [geometry],
  );
  const edges = useMemo(
    () =>
      geometry.edges
        .map((edge) => ({ edge, state: edgeStates?.[edge.id] ?? "default" }))
        .sort((a, b) => drawPriority(a.state) - drawPriority(b.state)),
    [edgeStates, geometry],
  );

  return (
    <svg className="dag-flow__edges" aria-hidden="true">
      {interactionPath && <path className="dag-flow__edge-interaction" d={interactionPath} />}
      {structuralPath && <path className="dag-flow__edge-path" d={structuralPath} />}
      {edges.map(({ edge, state }) => (
        <EdgeWrapper key={edge.id} edge={edge} state={state} />
      ))}
      <ConnectionLine />
    </svg>
  );
}

export default memo(EdgeRenderer);
