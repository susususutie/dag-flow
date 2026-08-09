import { describe, expect, it } from "vitest";
import { getSourcePoint, getTargetPoint } from "../edges/points.ts";

const position = { x: 10, y: 20 };
const dimensions = { width: 100, height: 40 };

describe("统一边端点", () => {
  it("水平布局使用左 target 和右 source", () => {
    expect(getTargetPoint("horizontal", position, dimensions)).toEqual({ x: 10, y: 40 });
    expect(getSourcePoint("horizontal", position, dimensions)).toEqual({ x: 110, y: 40 });
  });

  it("垂直布局使用上 target 和下 source", () => {
    expect(getTargetPoint("vertical", position, dimensions)).toEqual({ x: 60, y: 20 });
    expect(getSourcePoint("vertical", position, dimensions)).toEqual({ x: 60, y: 60 });
  });
});
