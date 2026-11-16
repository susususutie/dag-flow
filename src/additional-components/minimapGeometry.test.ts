import { describe, expect, it } from "vite-plus/test";
import {
  centerViewportOnMiniMapPoint,
  getMiniMapViewportOrigin,
  toMiniMapCoordinate,
} from "./minimapGeometry.ts";

describe("MiniMap 坐标换算", () => {
  it("使用图边界原点映射节点坐标", () => {
    expect(toMiniMapCoordinate(-50, -100, 0.5)).toBe(25);
  });

  it("视口框与点击居中使用同一图原点", () => {
    expect(getMiniMapViewportOrigin({ x: 100, y: -40, zoom: 2 }, { x: -100, y: -50 }, 0.5)).toEqual(
      { x: 25, y: 35 },
    );
    expect(
      centerViewportOnMiniMapPoint(
        { x: 25, y: 35 },
        { x: -100, y: -50 },
        0.5,
        { width: 800, height: 600 },
        2,
      ),
    ).toEqual({ x: 500, y: 260 });
  });
});
