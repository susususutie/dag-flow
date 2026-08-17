import { describe, expect, it } from "vitest";
import computeFitView from "../geometry.ts";

describe("computeFitView", () => {
  it("内容从 (0,0) 开始且能容纳时，四边留白对称", () => {
    const viewport = computeFitView({
      containerWidth: 1000,
      containerHeight: 600,
      contentWidth: 800,
      contentHeight: 400,
      padding: 40,
    });
    // 可用区 920×520，宽度受限：zoom = 920/800 = 1.15
    expect(viewport.zoom).toBeCloseTo(1.15);
    expect(viewport.x).toBeCloseTo(40);
    expect(viewport.y).toBeCloseTo(40 + (520 - 400 * 1.15) / 2);
  });

  it("内容边界不在原点时，补偿原点偏移保证视觉居中", () => {
    // 内容边界 y ∈ [-39.8, +39.8]，高度 79.6（并行分支位于主干上方）
    const viewport = computeFitView({
      containerWidth: 1080,
      containerHeight: 754,
      contentWidth: 1000,
      contentHeight: 79.6,
      contentX: 0,
      contentY: -39.8,
      padding: 40,
    });
    // 可用区 1000×674，恰好宽度铺满：zoom = 1；内容中心落在容器中心 377
    expect(viewport.zoom).toBe(1);
    expect(viewport.x).toBe(40);
    expect(viewport.y).toBe((754 - 79.6) / 2 + 39.8);
  });

  it("溢出时对齐方向仍生效，且保留原点补偿", () => {
    const viewport = computeFitView({
      containerWidth: 100,
      containerHeight: 100,
      contentWidth: 500,
      contentHeight: 500,
      contentX: 10,
      contentY: -20,
      minZoom: 0.5,
      maxZoom: 2,
      horizontalAlign: "left",
      verticalAlign: "top",
    });
    expect(viewport.zoom).toBe(0.5);
    expect(viewport.x).toBe(-10 * 0.5);
    expect(viewport.y).toBe(20 * 0.5);
  });
});
