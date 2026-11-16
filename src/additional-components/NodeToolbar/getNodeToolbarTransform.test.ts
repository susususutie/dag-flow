import { describe, expect, it } from "vite-plus/test";
import { Position } from "../../types/index.ts";
import getNodeToolbarTransform from "./getNodeToolbarTransform.ts";

const bounds = { x: 10, y: 20, width: 100, height: 40 };
const viewport = { x: 5, y: 7, zoom: 2 };

describe("getNodeToolbarTransform", () => {
  it("Top 使用屏幕像素 offset，工具栏自身居中且不缩放", () => {
    expect(getNodeToolbarTransform(bounds, viewport, Position.Top, 10, "center")).toBe(
      "translate(125px, 37px) translate(-50%, -100%)",
    );
  });

  it("Right + end 对齐到节点下边", () => {
    expect(getNodeToolbarTransform(bounds, viewport, Position.Right, 8, "end")).toBe(
      "translate(233px, 127px) translate(0%, -100%)",
    );
  });

  it("Bottom + start 对齐到节点左边", () => {
    expect(getNodeToolbarTransform(bounds, viewport, Position.Bottom, 6, "start")).toBe(
      "translate(25px, 133px) translate(0%, 0%)",
    );
  });

  it("Left + center 对齐到节点垂直中心", () => {
    expect(getNodeToolbarTransform(bounds, viewport, Position.Left, 4, "center")).toBe(
      "translate(21px, 87px) translate(-100%, -50%)",
    );
  });
});
