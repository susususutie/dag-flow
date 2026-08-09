import { Position } from "../../types/index.ts";
import type { Viewport } from "../../types/index.ts";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ToolbarPosition = Position.Top | Position.Right | Position.Bottom | Position.Left;
export type ToolbarAlign = "start" | "center" | "end";

export default function getNodeToolbarTransform(
  bounds: Rect,
  viewport: Viewport,
  position: ToolbarPosition,
  offset: number,
  align: ToolbarAlign,
): string {
  const left = bounds.x * viewport.zoom + viewport.x;
  const top = bounds.y * viewport.zoom + viewport.y;
  const width = bounds.width * viewport.zoom;
  const height = bounds.height * viewport.zoom;
  const alignFactor = align === "start" ? 0 : align === "end" ? 1 : 0.5;

  if (position === Position.Top || position === Position.Bottom) {
    const x = left + width * alignFactor;
    const y = position === Position.Top ? top - offset : top + height + offset;
    const selfX = -alignFactor * 100;
    const selfY = position === Position.Top ? -100 : 0;
    return `translate(${x}px, ${y}px) translate(${selfX}%, ${selfY}%)`;
  }

  const x = position === Position.Left ? left - offset : left + width + offset;
  const y = top + height * alignFactor;
  const selfX = position === Position.Left ? -100 : 0;
  const selfY = -alignFactor * 100;
  return `translate(${x}px, ${y}px) translate(${selfX}%, ${selfY}%)`;
}
