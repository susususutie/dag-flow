import { describe, expect, it } from "vitest";
import canvasReducer from "../reducer.ts";
import initialState from "../initialState.ts";
import type { StoreState, XYPosition } from "../../types/index.ts";

function stateWith(overrides: Partial<StoreState>): StoreState {
  return { ...initialState, ...overrides } as StoreState;
}

function node(id: string, extra: Record<string, unknown> = {}) {
  return { id, data: { label: id }, ...extra };
}

describe("canvasReducer 坐标化 state", () => {
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

  it("SET_COMPUTED_POSITIONS 整体替换", () => {
    const positions = new Map<string, XYPosition>([["a", { x: 10, y: 20 }]]);
    const s = canvasReducer(stateWith({}), { type: "SET_COMPUTED_POSITIONS", payload: positions });
    expect(s.computedPositions.get("a")).toEqual({ x: 10, y: 20 });
  });

  it("UPDATE_NODE_POSITION 写入 dragPositions（拖动 overlay）", () => {
    let s = stateWith({ nodeMap: new Map([["a", node("a")]]) });
    s = canvasReducer(s, {
      type: "UPDATE_NODE_POSITION",
      payload: { id: "a", position: { x: 5, y: 9 } },
    });
    expect(s.dragPositions.get("a")).toEqual({ x: 5, y: 9 });
    expect(s.nodeMap.get("a")?.position).toBeUndefined();
  });

  it("COMMIT_NODE_POSITIONS 焊死：position 并入 nodeMap 并清理 dragPositions", () => {
    let s = stateWith({ nodeMap: new Map([["a", node("a")]]) });
    s = canvasReducer(s, {
      type: "UPDATE_NODE_POSITION",
      payload: { id: "a", position: { x: 1, y: 2 } },
    });
    s = canvasReducer(s, {
      type: "COMMIT_NODE_POSITIONS",
      payload: { positions: new Map([["a", { x: 1, y: 2 }]]), clearIds: ["a"] },
    });
    expect(s.nodeMap.get("a")?.position).toEqual({ x: 1, y: 2 });
    expect(s.dragPositions.has("a")).toBe(false);
  });

  it("DELETE_NODE 清理 nodeDimensions/computedPositions/dragPositions", () => {
    let s = stateWith({
      nodeMap: new Map([["a", node("a")]]),
      nodeDimensions: new Map([["a", { width: 10, height: 10 }]]),
      computedPositions: new Map([["a", { x: 0, y: 0 }]]),
      dragPositions: new Map([["a", { x: 0, y: 0 }]]),
    });
    s = canvasReducer(s, { type: "DELETE_NODE", payload: { ids: ["a"] } });
    expect(s.nodeDimensions.has("a")).toBe(false);
    expect(s.computedPositions.has("a")).toBe(false);
    expect(s.dragPositions.has("a")).toBe(false);
    expect(s.nodeMap.has("a")).toBe(false);
  });

  it("CLEAR_NODE_POSITIONS 仅清指定 id（回弹）", () => {
    let s = stateWith({
      nodeMap: new Map([
        ["a", node("a")],
        ["b", node("b")],
      ]),
    });
    s = canvasReducer(s, {
      type: "UPDATE_NODE_POSITION",
      payload: { id: "a", position: { x: 1, y: 1 } },
    });
    s = canvasReducer(s, {
      type: "UPDATE_NODE_POSITION",
      payload: { id: "b", position: { x: 2, y: 2 } },
    });
    s = canvasReducer(s, { type: "CLEAR_NODE_POSITIONS", payload: { ids: ["a"] } });
    expect(s.dragPositions.has("a")).toBe(false);
    expect(s.dragPositions.get("b")).toEqual({ x: 2, y: 2 });
  });
});
