import { memo } from "react";
import useCanvasStore from "../../hooks/useCanvasStore.ts";
import { Position } from "../../types/index.ts";
import type { EdgeSpec } from "../../types/index.ts";
import { getSourcePoint, getTargetPoint } from "../../utils/edges/points.ts";
import SmoothStepEdge from "../Edges/SmoothStepEdge.tsx";

const DEFAULT_DIMENSIONS = { width: 150, height: 40 };

function EdgeWrapper(props: EdgeSpec) {
  const source = useCanvasStore((state) => state.nodeMap.get(props.source));
  const target = useCanvasStore((state) => state.nodeMap.get(props.target));
  const sourceDimensions = useCanvasStore(
    (state) => state.nodeDimensions.get(props.source) ?? DEFAULT_DIMENSIONS,
  );
  const targetDimensions = useCanvasStore(
    (state) => state.nodeDimensions.get(props.target) ?? DEFAULT_DIMENSIONS,
  );
  const direction = useCanvasStore((state) => state.direction);
  if (!source?.position || !target?.position) return null;

  const sourcePoint = getSourcePoint(direction, source.position, sourceDimensions);
  const targetPoint = getTargetPoint(direction, target.position, targetDimensions);
  return (
    <g className="dag-flow__edge" data-id={props.id}>
      <SmoothStepEdge
        {...props}
        sourceX={sourcePoint.x}
        sourceY={sourcePoint.y}
        targetX={targetPoint.x}
        targetY={targetPoint.y}
        sourcePosition={direction === "horizontal" ? Position.Right : Position.Bottom}
        targetPosition={direction === "horizontal" ? Position.Left : Position.Top}
      />
    </g>
  );
}

export default memo(EdgeWrapper);
