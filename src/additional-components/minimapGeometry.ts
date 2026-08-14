import type { Viewport, XYPosition } from "../types/index.ts";

export function toMiniMapCoordinate(value: number, origin: number, scale: number): number {
  return (value - origin) * scale;
}

export function getMiniMapViewportOrigin(
  viewport: Viewport,
  graphOrigin: XYPosition,
  scale: number,
): XYPosition {
  return {
    x: toMiniMapCoordinate(-viewport.x / viewport.zoom, graphOrigin.x, scale),
    y: toMiniMapCoordinate(-viewport.y / viewport.zoom, graphOrigin.y, scale),
  };
}

export function centerViewportOnMiniMapPoint(
  point: XYPosition,
  graphOrigin: XYPosition,
  scale: number,
  container: { width: number; height: number },
  zoom: number,
): Pick<Viewport, "x" | "y"> {
  const canvasX = graphOrigin.x + point.x / scale;
  const canvasY = graphOrigin.y + point.y / scale;
  return {
    x: -canvasX * zoom + container.width / 2,
    y: -canvasY * zoom + container.height / 2,
  };
}
