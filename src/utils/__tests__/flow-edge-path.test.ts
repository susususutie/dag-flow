import { describe, expect, it } from "vitest";
import type { DAGNode, FlowModel } from "../../types/index.ts";
import { getFlowEdgeRoutes } from "../edges/flowPath.ts";
import { computeLayout } from "../layout.ts";

function createGeometry(flow: FlowModel, ids: string[]) {
  const dimensions = new Map(ids.map((id) => [id, { width: 100, height: 40 }]));
  const positions = computeLayout(flow, dimensions, new Map(), { hGap: 160, vGap: 16 });
  const nodeMap = new Map<string, DAGNode>(
    ids.map((id) => [id, { id, position: positions.get(id) }]),
  );
  return { dimensions, nodeMap };
}

describe("默认边网络", () => {
  it("连续并行组共享汇合点、主干和分叉点", () => {
    const flow: FlowModel = [
      [["a"], ["b"]],
      [["c"], ["d"]],
    ];
    const { dimensions, nodeMap } = createGeometry(flow, ["a", "b", "c", "d"]);
    const routes = getFlowEdgeRoutes(flow, nodeMap, dimensions, "horizontal");

    expect(routes.find((route) => route.id === "merge:0:a")?.points.at(-1)).toEqual({
      x: 420,
      y: 0,
    });
    expect(routes.find((route) => route.id === "merge:0:b")?.points.at(-1)).toEqual({
      x: 420,
      y: 0,
    });
    expect(routes.find((route) => route.id === "transition:0->1")?.points).toEqual([
      { x: 420, y: 0 },
      { x: 580, y: 0 },
    ]);
    expect(routes.find((route) => route.id === "split:1:c")?.points[0]).toEqual({
      x: 580,
      y: 0,
    });
    expect(routes.find((route) => route.id === "split:1:d")?.points[0]).toEqual({
      x: 580,
      y: 0,
    });
  });

  it("不等长路径在最长路径之后汇合", () => {
    const flow: FlowModel = [[["short"], ["long1", "long2"]]];
    const { dimensions, nodeMap } = createGeometry(flow, ["short", "long1", "long2"]);
    const routes = getFlowEdgeRoutes(flow, nodeMap, dimensions, "horizontal");
    const shortMerge = routes.find((route) => route.id === "merge:0:short")?.points;
    const longMerge = routes.find((route) => route.id === "merge:0:long2")?.points;

    expect(shortMerge).toEqual([
      { x: 260, y: -28 },
      { x: 680, y: -28 },
      { x: 680, y: 0 },
    ]);
    expect(longMerge?.at(-1)).toEqual({ x: 680, y: 0 });
  });

  it("串行节点仍使用一条直接连线", () => {
    const flow: FlowModel = ["a", "b"];
    const { dimensions, nodeMap } = createGeometry(flow, ["a", "b"]);

    expect(getFlowEdgeRoutes(flow, nodeMap, dimensions, "horizontal")).toEqual([
      {
        id: "transition:0->1",
        points: [
          { x: 100, y: 0 },
          { x: 260, y: 0 },
        ],
      },
    ]);
  });

  it("串行节点与偶数分支并行组共用水平中心线", () => {
    const flow: FlowModel = ["start", [["a"], ["b"], ["c"], ["d"]], "done"];
    const { dimensions, nodeMap } = createGeometry(flow, ["start", "a", "b", "c", "d", "done"]);
    const routes = getFlowEdgeRoutes(flow, nodeMap, dimensions, "horizontal");

    expect(routes.find((route) => route.id === "transition:0->1")?.points).toEqual([
      { x: 100, y: 0 },
      { x: 260, y: 0 },
    ]);
    expect(routes.find((route) => route.id === "transition:1->2")?.points).toEqual([
      { x: 680, y: 0 },
      { x: 840, y: 0 },
    ]);
  });
});
