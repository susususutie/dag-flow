import { describe, expect, it } from "vitest";
import { reconnectNode } from "../reconnect.ts";
import type { FlowModel } from "../../types/index.ts";

describe("reconnectNode", () => {
  it("串行节点移动到另一串行节点之后", () => {
    const flow = ["a", "b", "c"] as FlowModel;
    expect(reconnectNode(flow, "c", "a")).toEqual(["a", "c", "b"]);
  });

  it("并行组内节点追加到另一路径末尾", () => {
    const flow = ["a", [["p1"], ["p2"]], "c"] as FlowModel;
    expect(reconnectNode(flow, "c", "p1")).toEqual(["a", [["p1", "c"], ["p2"]]]);
  });

  it("移除后原路径为空时收缩路径与组（防环拦截 p1→c 移后的环）", () => {
    const flow = ["a", [["p1"], ["p2"]], "c"] as FlowModel;
    // p1 移到 c 后会成环（p1→c→p1），应被拒绝
    expect(reconnectNode(flow, "p1", "c")).toBeNull();
    // p1 移到 a 后：组收缩为 p2，再插入 a 之后
    expect(reconnectNode(flow, "p1", "a")).toEqual(["a", "p1", "p2", "c"]);
  });

  it("组内节点移到并行组外路径尾", () => {
    const flow = ["a", [["p1", "x"], ["p2"]], "c"] as FlowModel;
    // x 从组内移到 a 之后
    expect(reconnectNode(flow, "x", "a")).toEqual(["a", "x", [["p1"], ["p2"]], "c"]);
  });

  it("自连返回 null", () => {
    expect(reconnectNode(["a", "b"] as FlowModel, "b", "b")).toBeNull();
  });

  it("成环重连返回 null", () => {
    const flow = ["a", "b", "c"] as FlowModel;
    // afterId = c 是 b 的后代 → 环
    expect(reconnectNode(flow, "a", "c")).toBeNull();
  });

  it("不存在的节点返回 null", () => {
    expect(reconnectNode(["a", "b"] as FlowModel, "x", "b")).toBeNull();
    expect(reconnectNode(["a", "b"] as FlowModel, "b", "x")).toBeNull();
  });
});
