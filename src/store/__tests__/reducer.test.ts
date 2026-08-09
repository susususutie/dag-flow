import { describe, expect, it } from "vitest";
import canvasReducer from "../reducer.ts";
import initialState from "../initialState.ts";
import { assertValidDAG, createNodeMap } from "../utils.ts";
import type { StoreState } from "../../types/index.ts";
import { syncCanvasProps } from "../utils.ts";

function stateWith(overrides: Partial<StoreState>): StoreState {
  return { ...initialState, ...overrides } as StoreState;
}

function node(id: string, extra: Record<string, unknown> = {}) {
  return { id, data: { label: id }, ...extra };
}

describe("canvasReducer 坐标化 state", () => {
  it("createNodeMap 为缺省坐标补充原点", () => {
    const positioned = node("b", { position: { x: 3, y: 4 } });
    const nodeMap = createNodeMap([node("a"), positioned]);
    expect(nodeMap.get("a")?.position).toEqual({ x: 0, y: 0 });
    expect(nodeMap.get("b")).toBe(positioned);
  });

  it("拒绝重复或与 flow 不一致的节点 ID", () => {
    expect(() => createNodeMap([node("a"), node("a")])).toThrow("duplicate node IDs");
    expect(() => assertValidDAG(createNodeMap([node("a")]), ["b"])).toThrow("missing from flow");
    expect(() => assertValidDAG(createNodeMap([node("a")]), ["a", "a"])).toThrow(
      "duplicate node IDs",
    );
  });

  it("syncCanvasProps 在复用 DagFlowProvider 时同步 nodeTypes", () => {
    const CustomNode = () => null;
    const nodeTypes = { custom: CustomNode };
    const s = syncCanvasProps(stateWith({}), { nodeTypes }, false);
    expect(s.nodeTypes).toBe(nodeTypes);
  });

  it("SET_NODE_DIMENSIONS 合并尺寸，跳过相同值", () => {
    let s = stateWith({ nodeDimensions: new Map([["a", { width: 100, height: 40 }]]) });
    s = canvasReducer(s, {
      type: "SET_NODE_DIMENSIONS",
      payload: new Map([
        ["a", { width: 100, height: 40 }],
        ["b", { width: 200, height: 80 }],
      ]),
    });
    expect(s.nodeDimensions.get("a")).toEqual({ width: 100, height: 40 });
    expect(s.nodeDimensions.get("b")).toEqual({ width: 200, height: 80 });
  });

  it("UPDATE_NODE_POSITION 直接更新 node.position", () => {
    const original = node("a", { position: { x: 0, y: 0 } });
    let s = stateWith({ nodeMap: new Map([["a", original]]) });
    s = canvasReducer(s, {
      type: "UPDATE_NODE_POSITION",
      payload: { id: "a", position: { x: 5, y: 9 } },
    });
    expect(s.nodeMap.get("a")?.position).toEqual({ x: 5, y: 9 });
    expect(s.nodeMap.get("a")).not.toBe(original);
  });

  it("重复点击已选节点时保持选中", () => {
    const nodeMap = createNodeMap([node("a")]);
    const selectedNodes = new Set(["a"]);
    const s = stateWith({ nodeMap, flow: ["a"], selectedNodes });
    expect(canvasReducer(s, { type: "UPDATE_SELECTED_NODE", payload: { id: "a" } })).toBe(s);
  });

  it("一次拖拽只记录一条可撤销的起点快照", () => {
    let s = stateWith({
      nodeMap: createNodeMap([node("a", { position: { x: 0, y: 0 } })]),
    });
    s = canvasReducer(s, {
      type: "UPDATE_NODE_POSITION",
      payload: { id: "a", position: { x: 4, y: 6 }, dragging: true },
    });
    expect(s.history).toHaveLength(0);

    s = canvasReducer(s, {
      type: "UPDATE_NODE_POSITION",
      payload: {
        id: "a",
        position: { x: 4, y: 6 },
        dragging: false,
        origin: { x: 0, y: 0 },
      },
    });
    expect(s.history).toHaveLength(1);
    expect(s.history[0].nodeMap.get("a")?.position).toEqual({ x: 0, y: 0 });

    s = canvasReducer(s, { type: "UNDO" });
    expect(s.nodeMap.get("a")?.position).toEqual({ x: 0, y: 0 });
  });

  it("DELETE_NODE 清理节点尺寸", () => {
    let s = stateWith({
      nodeMap: new Map([["a", node("a")]]),
      nodeDimensions: new Map([["a", { width: 10, height: 10 }]]),
    });
    s = canvasReducer(s, { type: "DELETE_NODE", payload: { ids: ["a"] } });
    expect(s.nodeDimensions.has("a")).toBe(false);
    expect(s.nodeMap.has("a")).toBe(false);
  });
});
