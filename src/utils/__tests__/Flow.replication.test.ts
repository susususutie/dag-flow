import { describe, expect, it } from "vite-plus/test";
import Flow, { type FlowClipboard } from "../Flow.ts";

describe("Flow.duplicateNodeIds", () => {
  it("生成不冲突的 seed-2 后缀 ID", () => {
    const flow = new Flow(["a", ["b"] as unknown as string]);
    const pairs = flow.duplicateNodeIds(["a", "b"]);
    expect(pairs).toEqual([
      { from: "a", to: "a-2" },
      { from: "b", to: "b-2" },
    ]);
  });

  it("已占用后缀时递增规避", () => {
    const flow = new Flow(["a", "a-2"]);
    const pairs = flow.duplicateNodeIds(["a", "x"]);
    expect(pairs).toEqual([{ from: "a", to: "a-3" }]);
  });
});

describe("Flow.cloneToClipboard", () => {
  it("串行选择复制为串行步骤", () => {
    const flow = new Flow(["a", "b", "c"]);
    const clip = flow.cloneToClipboard(["b"]);
    expect(clip).toEqual({ steps: ["b"] });
  });

  it("并行组内选单条路径：完整复制该路径（单路径收缩为串行）", () => {
    const flow = new Flow([[["p1", "p1b", "p1c"], ["p2"]]]);
    const clip = flow.cloneToClipboard(["p1b"]);
    expect(clip).toEqual({ steps: ["p1", "p1b", "p1c"] });
  });

  it("全组选择：保持组结构整体复制", () => {
    const flow = new Flow([[["p1", "p1b"], ["p2"]]]);
    const clip = flow.cloneToClipboard(["p1b", "p2"]);
    expect(clip).toEqual({ steps: [[["p1", "p1b"], ["p2"]]] });
  });

  it("无匹配返回 null", () => {
    const flow = new Flow(["a"]);
    expect(flow.cloneToClipboard(["x"])).toBeNull();
  });
});

describe("Flow.paste", () => {
  it("无锚追加到尾部并生成不冲突副本", () => {
    const flow = new Flow(["a", "b"]);
    const clip: FlowClipboard = { steps: ["b"] };
    const { flow: out, pairs } = flow.paste(clip);
    expect(pairs).toEqual([{ from: "b", to: "b-2" }]);
    expect(out).toEqual(["a", "b", "b-2"]);
  });

  it("锚点后插入并转换嵌套结构", () => {
    const flow = new Flow(["a", [["p1"], ["p2"]]]);
    const clip: FlowClipboard = { steps: [[["p1"], ["p2"]]] };
    const { flow: out, pairs } = flow.paste(clip, "a");
    expect(pairs).toEqual([
      { from: "p1", to: "p1-2" },
      { from: "p2", to: "p2-2" },
    ]);
    expect(out).toEqual(["a", [["p1-2"], ["p2-2"]], [["p1"], ["p2"]]]);
  });

  it("不修改剪贴板（引用隔离）", () => {
    const flow = new Flow(["a"]);
    const clip: FlowClipboard = { steps: ["a"] };
    flow.paste(clip);
    expect(clip).toEqual({ steps: ["a"] });
    expect(flow.toArray()).toEqual(["a", "a-2"]);
  });
});

describe("Flow.duplicateNodes", () => {
  it("串行节点复制到其后", () => {
    const flow = new Flow(["a", "b", "c"]);
    const pairs = flow.duplicateNodes(["b"]);
    expect(pairs).toEqual([{ from: "b", to: "b-2" }]);
    expect(flow.toArray()).toEqual(["a", "b", "b-2", "c"]);
  });

  it("并行组内选单条路径：副本以串行步骤插入组后", () => {
    const flow = new Flow(["a", [["p1", "x"], ["p2"]], "c"]);
    const pairs = flow.duplicateNodes(["x"]);
    expect(pairs).toEqual([
      { from: "p1", to: "p1-2" },
      { from: "x", to: "x-2" },
    ]);
    expect(flow.toArray()).toEqual(["a", [["p1", "x"], ["p2"]], "p1-2", "x-2", "c"]);
  });

  it("并行组内全选：副本保持组结构插入组后", () => {
    const flow = new Flow(["a", [["p1"], ["p2"]], "c"]);
    const pairs = flow.duplicateNodes(["p1", "p2"]);
    expect(pairs).toEqual([
      { from: "p1", to: "p1-2" },
      { from: "p2", to: "p2-2" },
    ]);
    expect(flow.toArray()).toEqual(["a", [["p1"], ["p2"]], [["p1-2"], ["p2-2"]], "c"]);
  });
});
