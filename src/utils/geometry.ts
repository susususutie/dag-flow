import type { FitViewOptions, Viewport } from "../types/index.ts";

interface FitViewParams {
  containerWidth: number;
  containerHeight: number;
  contentWidth: number;
  contentHeight: number;
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  minZoom?: number;
  maxZoom?: number;
  horizontalAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "center" | "bottom";
}

/**
 * 计算 fitView 对应的画布 transform（x, y, zoom）。
 * React Flow 语义：缩放内容使其在容器内完整可见并居中；缩放受限而无法完整容纳时可指定溢出方向。
 */
export default function computeFitView({
  containerWidth,
  containerHeight,
  contentWidth,
  contentHeight,
  padding = 0,
  minZoom = 0.1,
  maxZoom = Infinity,
  horizontalAlign = "center",
  verticalAlign = "center",
}: FitViewParams): Viewport {
  const resolvedPadding = resolvePadding(padding, containerWidth, containerHeight);
  const availWidth = Math.max(containerWidth - resolvedPadding.left - resolvedPadding.right, 0);
  const availHeight = Math.max(containerHeight - resolvedPadding.top - resolvedPadding.bottom, 0);
  if (!availWidth || !availHeight || !contentWidth || !contentHeight) {
    return { x: 0, y: 0, zoom: 1 };
  }

  const fitZoom = Math.min(availWidth / contentWidth, availHeight / contentHeight);
  const zoom = Math.min(Math.max(fitZoom, minZoom), maxZoom);
  const scaledWidth = contentWidth * zoom;
  const scaledHeight = contentHeight * zoom;

  return {
    x:
      resolvedPadding.left +
      getAlignmentOffset(availWidth, scaledWidth, horizontalAlign, "left", "right"),
    y:
      resolvedPadding.top +
      getAlignmentOffset(availHeight, scaledHeight, verticalAlign, "top", "bottom"),
    zoom,
  };
}

function resolvePadding(
  padding: NonNullable<FitViewOptions["padding"]>,
  containerWidth: number,
  containerHeight: number,
) {
  const input =
    typeof padding === "number"
      ? { top: padding, right: padding, bottom: padding, left: padding }
      : (padding ?? {});
  const horizontal = normalizePaddingPair(input.left, input.right, containerWidth);
  const vertical = normalizePaddingPair(input.top, input.bottom, containerHeight);

  return {
    top: vertical.start,
    right: horizontal.end,
    bottom: vertical.end,
    left: horizontal.start,
  };
}

function normalizePaddingPair(
  start: number | undefined,
  end: number | undefined,
  size: number,
): { start: number; end: number } {
  const safeStart = start !== undefined && Number.isFinite(start) && start >= 0 ? start : 0;
  const safeEnd = end !== undefined && Number.isFinite(end) && end >= 0 ? end : 0;
  const total = safeStart + safeEnd;

  if (!Number.isFinite(size) || size <= 0 || total >= size) return { start: 0, end: 0 };
  return { start: safeStart, end: safeEnd };
}

function getAlignmentOffset(
  availableSize: number,
  contentSize: number,
  alignment: "left" | "center" | "right" | "top" | "bottom",
  start: "left" | "top",
  end: "right" | "bottom",
) {
  const remaining = availableSize - contentSize;
  if (remaining >= 0) return remaining / 2;
  if (alignment === start) return 0;
  if (alignment === end) return remaining;
  return remaining / 2;
}
