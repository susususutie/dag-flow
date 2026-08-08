import { memo } from "react";
import type { EdgeProps } from "../../types/index.ts";
import { getSmoothStepPath } from "../../utils/edges/paths.ts";

/**
 * 默认边：平滑直角折线（RF SmoothStepEdge 对齐）。
 * 锚点方向固定 源 Right → 目标 Left；selected 时增强描边以便点击。
 */
function SmoothStepEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected } =
    props;

  const [d] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path d={d} className="dag-flow__edge-interaction" />
      <path
        id={id}
        d={d}
        className={`dag-flow__edge-path${selected ? " dag-flow__edge-path--selected" : ""}`}
        fill="none"
      />
    </>
  );
}

export default memo(SmoothStepEdge);
