import { memo, useMemo } from "react";
import EdgeWrapper from "../../components/EdgeWrapper/index.tsx";
import useCanvasStore from "../../hooks/useCanvasStore.ts";
import useFlow from "../../hooks/useFlow.ts";
import { Position } from "../../types/index.ts";
import { computeDagEdges } from "../../utils/edges.ts";
import { getSourcePoint } from "../../utils/edges/points.ts";
import { getSmoothStepPath } from "../../utils/edges/paths.ts";

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

function EdgeRenderer() {
  const flow = useFlow();
  const edges = useMemo(() => computeDagEdges(flow), [flow]);

  return (
    <svg className="dag-flow__edges" aria-hidden="true">
      {edges.map((edge) => (
        <EdgeWrapper key={edge.id} {...edge} />
      ))}
      <ConnectionLine />
    </svg>
  );
}

export default memo(EdgeRenderer);
