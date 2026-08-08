import { describe, expect, it } from "vitest";
import { getSmoothStepPath, getBezierPath, getStraightPath } from "../edges/paths.ts";
import { Position } from "../../types/edges.ts";

describe("getStraightPath", () => {
  it("生成直线路径与中点 label 坐标", () => {
    const [path, labelX, labelY, offsetX, offsetY] = getStraightPath({
      sourceX: 0,
      sourceY: 10,
      targetX: 200,
      targetY: 10,
    });
    expect(path).toBe("M 0,10L 200,10");
    expect(labelX).toBe(100);
    expect(labelY).toBe(10);
    expect(offsetX).toBe(100);
    expect(offsetY).toBe(0);
  });
});

describe("getBezierPath", () => {
  it("水平流向（Right→Left）：控制点水平偏移", () => {
    const [path] = getBezierPath({
      sourceX: 0,
      sourceY: 20,
      sourcePosition: Position.Right,
      targetX: 150,
      targetY: 100,
      targetPosition: Position.Left,
    });
    expect(path.startsWith("M0,20 C75,20")).toBe(true);
    expect(path).toContain("75,100 150,100");
  });

  it("目标在源左侧（反向）时控制点随 curvature 扩展", () => {
    const [p1] = getBezierPath({
      sourceX: 150,
      sourceY: 20,
      sourcePosition: Position.Right,
      targetX: 0,
      targetY: 100,
      targetPosition: Position.Left,
      curvature: 0.25,
    });
    const [p2] = getBezierPath({
      sourceX: 150,
      sourceY: 20,
      sourcePosition: Position.Right,
      targetX: 0,
      targetY: 100,
      targetPosition: Position.Left,
      curvature: 1,
    });
    expect(p1.startsWith("M150,20 C")).toBe(true);
    expect(p2.startsWith("M150,20 C")).toBe(true);
    const ctl1 = Number(/C([-\d.]+)/.exec(p1)?.[1]);
    const ctl2 = Number(/C([-\d.]+)/.exec(p2)?.[1]);
    expect(ctl2).toBeGreaterThan(ctl1);
  });
});

describe("getSmoothStepPath", () => {
  it("同层水平连接：offset 间隔点 + 纯水平段", () => {
    const [path] = getSmoothStepPath({
      sourceX: 0,
      sourceY: 20,
      sourcePosition: Position.Right,
      targetX: 150,
      targetY: 20,
      targetPosition: Position.Left,
    });
    expect(path.startsWith("M0 20")).toBe(true);
    expect(path.endsWith("L150 20")).toBe(true);
    expect(path).not.toContain("Q ");
  });

  it("垂直落差时输出含折弯的正交折线", () => {
    const [path] = getSmoothStepPath({
      sourceX: 0,
      sourceY: 20,
      sourcePosition: Position.Right,
      targetX: 150,
      targetY: 100,
      targetPosition: Position.Left,
    });
    expect(path.startsWith("M0 20")).toBe(true);
    expect(path.endsWith("L150 100")).toBe(true);
    expect(path).toContain("L 75,95Q 75,100 80,100"); // 垂直段折弯
  });

  it("目标在源左侧（反向）时路径先右再回", () => {
    const [path] = getSmoothStepPath({
      sourceX: 200,
      sourceY: 20,
      sourcePosition: Position.Right,
      targetX: 50,
      targetY: 20,
      targetPosition: Position.Left,
    });
    expect(path).toContain("M200 20");
    expect(path).toContain("L50 20");
    expect(path.length).toBeGreaterThan(20);
  });

  it("borderRadius 影响折弯（Q 段出现）", () => {
    const [path] = getSmoothStepPath({
      sourceX: 0,
      sourceY: 20,
      sourcePosition: Position.Right,
      targetX: 150,
      targetY: 100,
      targetPosition: Position.Left,
      borderRadius: 5,
    });
    expect(path).toContain("Q ");
  });
});
