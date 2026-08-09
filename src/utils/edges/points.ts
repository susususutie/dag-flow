import type { FlowDirection, XYPosition } from "../../types/index.ts";

export function getSourcePoint(
  direction: FlowDirection,
  position: XYPosition,
  dimensions: { width: number; height: number },
) {
  return direction === "horizontal"
    ? { x: position.x + dimensions.width, y: position.y + dimensions.height / 2 }
    : { x: position.x + dimensions.width / 2, y: position.y + dimensions.height };
}

export function getTargetPoint(
  direction: FlowDirection,
  position: XYPosition,
  dimensions: { width: number; height: number },
) {
  return direction === "horizontal"
    ? { x: position.x, y: position.y + dimensions.height / 2 }
    : { x: position.x + dimensions.width / 2, y: position.y };
}
