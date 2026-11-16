import { describe, expect, it } from "vite-plus/test";
import type { DAGNode, FlowModel } from "../../types/index.ts";
import { getFlowEdgeGeometries, getFlowEdgeRoutes } from "../edges/flowPath.ts";
import { computeDagEdges } from "../edges.ts";
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

  it("删除分支后重新布局前主干仍使用串行节点中心线", () => {
    const initialFlow: FlowModel = ["start", [["a"], ["b"], ["c"], ["d"]], "done"];
    const changedFlow: FlowModel = ["start", [["a"], ["b"], ["c"]], "done"];
    const { dimensions, nodeMap } = createGeometry(initialFlow, [
      "start",
      "a",
      "b",
      "c",
      "d",
      "done",
    ]);
    const routes = getFlowEdgeRoutes(changedFlow, nodeMap, dimensions, "horizontal");

    expect(routes.find((route) => route.id === "split:1:a")?.points[0].y).toBe(0);
    expect(routes.find((route) => route.id === "merge:1:c")?.points.at(-1)?.y).toBe(0);
    expect(routes.find((route) => route.id === "transition:0->1")?.points).toEqual([
      { x: 100, y: 0 },
      { x: 260, y: 0 },
    ]);
  });

  it("垂直布局的主干保持在同一条垂直线上", () => {
    const flow: FlowModel = ["start", [["a"], ["b"], ["c"], ["d"]], "done"];
    const ids = ["start", "a", "b", "c", "d", "done"];
    const dimensions = new Map(ids.map((id) => [id, { width: 100, height: 40 }]));
    const positions = computeLayout(flow, dimensions, new Map(), {
      hGap: 160,
      vGap: 16,
      direction: "vertical",
    });
    const nodeMap = new Map<string, DAGNode>(
      ids.map((id) => [id, { id, position: positions.get(id) }]),
    );
    const routes = getFlowEdgeRoutes(flow, nodeMap, dimensions, "vertical");

    expect(routes.find((route) => route.id === "transition:0->1")?.points).toEqual([
      { x: 0, y: 40 },
      { x: 0, y: 200 },
    ]);
    expect(routes.find((route) => route.id === "transition:1->2")?.points).toEqual([
      { x: 0, y: 560 },
      { x: 0, y: 720 },
    ]);
  });

  it("按逻辑边聚合分叉、主干与汇合分段", () => {
    const flow: FlowModel = ["start", [["a"], ["b"]], "done"];
    const { dimensions, nodeMap } = createGeometry(flow, ["start", "a", "b", "done"]);
    const geometry = getFlowEdgeGeometries(flow, nodeMap, dimensions, "horizontal");

    expect(geometry.edges.map((edge) => edge.id)).toEqual([
      "start->a",
      "start->b",
      "a->done",
      "b->done",
    ]);
    expect(geometry.structural).toEqual([]);
    expect(geometry.edges.find((edge) => edge.id === "start->a")?.points).toEqual([
      { x: 100, y: 0 },
      { x: 260, y: 0 },
      { x: 260, y: -28 },
      { x: 420, y: -28 },
    ]);
    expect(geometry.edges.find((edge) => edge.id === "a->done")?.points).toEqual([
      { x: 520, y: -28 },
      { x: 680, y: -28 },
      { x: 680, y: 0 },
      { x: 840, y: 0 },
    ]);
  });

  it("首尾并行组的分叉与汇合段作为中性结构段", () => {
    const flow: FlowModel = [[["a"], ["b"]]];
    const { dimensions, nodeMap } = createGeometry(flow, ["a", "b"]);
    const geometry = getFlowEdgeGeometries(flow, nodeMap, dimensions, "horizontal");

    expect(geometry.edges).toEqual([]);
    expect(geometry.structural).toHaveLength(4);
  });

  it("computeDagEdges 与渲染几何使用同一组逻辑边 id", () => {
    const flow: FlowModel = ["a", [["b", "c"], ["d"]], "e"];
    const { dimensions, nodeMap } = createGeometry(flow, ["a", "b", "c", "d", "e"]);
    const geometry = getFlowEdgeGeometries(flow, nodeMap, dimensions, "horizontal");

    expect(geometry.edges.map((edge) => edge.id).sort()).toEqual(
      computeDagEdges(flow)
        .map((edge) => edge.id)
        .sort(),
    );
  });
});
