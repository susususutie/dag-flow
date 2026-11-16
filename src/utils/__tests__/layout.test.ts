import { describe, expect, it } from "vite-plus/test";
import { computeLayout, getNodesBounds } from "../layout.ts";
import type { FlowModel, XYPosition } from "../../types/index.ts";

const DIMS = new Map<string, { width: number; height: number }>([
  ["a", { width: 100, height: 40 }],
  ["b", { width: 100, height: 40 }],
  ["c", { width: 100, height: 40 }],
  ["p1", { width: 100, height: 40 }],
  ["p2", { width: 100, height: 40 }],
  ["p3", { width: 100, height: 40 }],
  ["b1", { width: 100, height: 40 }],
  ["b2", { width: 100, height: 40 }],
]);

const OPTS = { hGap: 160, vGap: 16 };

describe("computeLayout 串行", () => {
  it("同层串行节点同行水平排布", () => {
    const out = computeLayout(["a", "b", "c"] as FlowModel, DIMS, new Map(), OPTS);
    expect(out.get("a")).toEqual({ x: 0, y: -20 });
    expect(out.get("b")).toEqual({ x: 260, y: -20 });
    expect(out.get("c")).toEqual({ x: 520, y: -20 });
  });
});

describe("computeLayout 并行", () => {
  it("并行组垂直聚中：首列 centerY=0", () => {
    const out = computeLayout(
      ["a", [["p1"], ["p2"], ["p3"]], "c"] as FlowModel,
      DIMS,
      new Map(),
      OPTS,
    );
    // a 在列 0，中心 y=0
    expect(out.get("a")).toEqual({ x: 0, y: -20 });
    // 并行组高度 40*3+16*2=152，top = -76
    expect(out.get("p1")).toEqual({ x: 420, y: -76 });
    expect(out.get("p2")).toEqual({ x: 420, y: -20 });
    expect(out.get("p3")).toEqual({ x: 420, y: 36 });
    // c 与并行组中心对齐
    expect(out.get("c")).toEqual({ x: 840, y: -20 });
  });

  it("组内路径横向串联", () => {
    const out = computeLayout([[["b1", "b2"], ["p2"]]] as FlowModel, DIMS, new Map(), OPTS);
    const b1 = out.get("b1")!;
    const b2 = out.get("b2")!;
    expect(b1.x).toBe(OPTS.hGap);
    expect(b2.x).toBe(b1.x + 100 + OPTS.hGap);
    expect(b1.y).toBe(b2.y);
  });

  it("连续并行组为汇合总线、主干和分叉总线各保留一段", () => {
    const out = computeLayout(
      [
        [["p1"], ["p2"]],
        [["b1"], ["b2"]],
      ] as FlowModel,
      DIMS,
      new Map(),
      OPTS,
    );

    expect(out.get("p1")?.x).toBe(160);
    expect(out.get("b1")?.x).toBe(740);
    expect(out.get("b1")!.x - (out.get("p1")!.x + 100)).toBe(OPTS.hGap * 3);
  });

  it("不同高度的串行节点与偶数分支并行组按中心对齐", () => {
    const dimensions = new Map(DIMS);
    dimensions.set("a", { width: 100, height: 52 });
    dimensions.set("c", { width: 100, height: 28 });
    const out = computeLayout(
      ["a", [["p1"], ["p2"], ["p3"], ["b1"]], "c"] as FlowModel,
      dimensions,
      new Map(),
      OPTS,
    );

    expect(out.get("a")?.y).toBe(-26);
    expect(out.get("c")?.y).toBe(-14);
    expect(out.get("a")!.y + 52 / 2).toBe(0);
    expect(out.get("c")!.y + 28 / 2).toBe(0);
  });

  it("增减并行分支不会改变水平主干线", () => {
    const twoBranches = computeLayout(
      ["a", [["p1"], ["p2"]], "c"] as FlowModel,
      DIMS,
      new Map(),
      OPTS,
    );
    const fourBranches = computeLayout(
      ["a", [["p1"], ["p2"], ["p3"], ["b1"]], "c"] as FlowModel,
      DIMS,
      new Map(),
      OPTS,
    );

    expect(twoBranches.get("a")!.y + 20).toBe(0);
    expect(twoBranches.get("c")!.y + 20).toBe(0);
    expect(fourBranches.get("a")!.y + 20).toBe(0);
    expect(fourBranches.get("c")!.y + 20).toBe(0);
    expect(twoBranches.get("p1")!.y).toBe(-48);
    expect(fourBranches.get("p1")!.y).toBe(-104);
  });
});

describe("computeLayout 垂直布局", () => {
  it("增减并行分支不会改变垂直主干线", () => {
    const options = { ...OPTS, direction: "vertical" as const };
    const twoBranches = computeLayout(
      ["a", [["p1"], ["p2"]], "c"] as FlowModel,
      DIMS,
      new Map(),
      options,
    );
    const fourBranches = computeLayout(
      ["a", [["p1"], ["p2"], ["p3"], ["b1"]], "c"] as FlowModel,
      DIMS,
      new Map(),
      options,
    );

    expect(twoBranches.get("a")).toEqual({ x: -50, y: 0 });
    expect(twoBranches.get("c")).toEqual({ x: -50, y: 720 });
    expect(fourBranches.get("a")).toEqual({ x: -50, y: 0 });
    expect(fourBranches.get("c")).toEqual({ x: -50, y: 720 });
    expect(twoBranches.get("p1")?.x).toBe(-108);
    expect(fourBranches.get("p1")?.x).toBe(-224);
  });
});

describe("computeLayout pinned 焊死与避让", () => {
  it("pinned 节点不参与计算，后续列从 pinned 右缘避让", () => {
    const pinned = new Map<string, XYPosition>([["b", { x: 400, y: 100 }]]);
    const out = computeLayout(["a", "b", "c"] as FlowModel, DIMS, pinned, OPTS);
    expect(out.has("b")).toBe(false);
    // a 正常排布
    expect(out.get("a")).toEqual({ x: 0, y: -20 });
    // c 列 x = max(a右=100, pinned右=500) + hGap = 660
    expect(out.get("c")!.x).toBe(660);
  });

  it("并行组内 pinned 影响组外后续列锚", () => {
    const pinned = new Map<string, XYPosition>([["p2", { x: 260, y: 5 }]]);
    const out = computeLayout(
      ["a", [["p1"], ["p2"], ["p3"]], "c"] as FlowModel,
      DIMS,
      pinned,
      OPTS,
    );
    expect(out.has("p2")).toBe(false);
    // p1/p3 仍在组内排布（取 pinned.x=260 为列锚）
    expect(out.get("p1")!.x).toBe(260);
    // 组列右缘后保留汇合总线，再以一段间距放置 c
    expect(out.get("c")!.x).toBe(680);
    // 组列中心跟随 pinned 中心 y（pinned 中心 = 5 + 20 = 25）
    expect(out.get("p1")!.y).toBe(25 - 152 / 2);
  });
});

describe("getNodesBounds", () => {
  it("合并 position 与尺寸计算边界", () => {
    const positions = new Map<string, XYPosition>([
      ["a", { x: 0, y: 0 }],
      ["b", { x: 200, y: 50 }],
    ]);
    const dims = new Map([
      ["a", { width: 100, height: 40 }],
      ["b", { width: 80, height: 60 }],
    ]);
    expect(getNodesBounds(positions, dims)).toEqual({ x: 0, y: 0, width: 280, height: 110 });
  });

  it("空位置返回 null", () => {
    expect(getNodesBounds(new Map(), new Map())).toBeNull();
  });
});
