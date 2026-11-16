import { describe, expect, it } from "vite-plus/test";
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

  it("关闭自动布局时初始坐标立即可用", () => {
    const s = syncCanvasProps(
      stateWith({ autoLayout: true, layoutReady: false, nodeMap: createNodeMap([node("a")]) }),
      { autoLayout: false },
      false,
    );
    expect(s.autoLayout).toBe(false);
    expect(s.layoutReady).toBe(true);
  });

  it("syncCanvasProps 忽略内部变更的等价受控回写", () => {
    const data = { label: "a" };
    const s = stateWith({
      flow: ["a"],
      nodeMap: createNodeMap([{ id: "a", data, position: { x: 10, y: 20 } }]),
      selectedNodes: new Set(["a"]),
    });

    expect(
      syncCanvasProps(
        s,
        {
          flow: ["a"],
          nodes: [{ id: "a", data, selected: true, position: { x: 10, y: 20 } }],
        },
        false,
      ),
    ).toBe(s);
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

  it("APPLY_LAYOUT 只更新坐标并保持视口与历史", () => {
    const history = [
      {
        flow: ["a"],
        nodeMap: createNodeMap([node("a", { position: { x: 0, y: 0 } })]),
        selectedNodes: new Set<string>(),
      },
    ];
    const transform = { x: -462, y: 133, zoom: 2 };
    const s = canvasReducer(
      stateWith({
        flow: ["a"],
        nodeMap: createNodeMap([node("a", { position: { x: 0, y: 0 } })]),
        transform,
        history,
        layoutReady: false,
      }),
      { type: "APPLY_LAYOUT", payload: new Map([["a", { x: 120, y: -20 }]]) },
    );

    expect(s.nodeMap.get("a")?.position).toEqual({ x: 120, y: -20 });
    expect(s.transform).toBe(transform);
    expect(s.history).toBe(history);
    expect(s.layoutReady).toBe(true);
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

  it("SET_DAG 清理失效尺寸并保留仅位置变化节点的尺寸", () => {
    const previousA = node("a", { data: { label: "A" }, position: { x: 0, y: 0 } });
    const previousB = node("b", { data: { label: "B" }, position: { x: 0, y: 0 } });
    const dimensions = new Map([
      ["a", { width: 100, height: 40 }],
      ["b", { width: 120, height: 50 }],
    ]);
    let s = stateWith({
      flow: ["a", "b"],
      nodeMap: createNodeMap([previousA, previousB]),
      nodeDimensions: dimensions,
    });

    s = canvasReducer(s, {
      type: "SET_DAG",
      payload: {
        flow: ["a", "c"],
        nodeMap: createNodeMap([
          { ...previousA, position: { x: 20, y: 30 } },
          node("c", { position: { x: 0, y: 0 } }),
        ]),
      },
    });

    expect(s.nodeDimensions.get("a")).toEqual({ width: 100, height: 40 });
    expect(s.nodeDimensions.has("b")).toBe(false);
    expect(s.nodeDimensions.has("c")).toBe(false);
  });

  it("SET_DAG 在节点类型或数据变化时使尺寸失效", () => {
    const previous = node("a", { type: "old", data: { label: "A" } });
    const s = canvasReducer(
      stateWith({
        flow: ["a"],
        nodeMap: createNodeMap([previous]),
        nodeDimensions: new Map([["a", { width: 100, height: 40 }]]),
      }),
      {
        type: "SET_DAG",
        payload: {
          flow: ["a"],
          nodeMap: createNodeMap([{ ...previous, type: "next" }]),
        },
      },
    );

    expect(s.nodeDimensions.has("a")).toBe(false);
  });

  it("撤销节点渲染数据时使当前尺寸失效", () => {
    const previous = node("a", { data: { label: "old" } });
    const current = node("a", { data: { label: "current" } });
    const s = canvasReducer(
      stateWith({
        flow: ["a"],
        nodeMap: createNodeMap([current]),
        nodeDimensions: new Map([["a", { width: 100, height: 40 }]]),
        history: [
          {
            flow: ["a"],
            nodeMap: createNodeMap([previous]),
            selectedNodes: new Set<string>(),
          },
        ],
      }),
      { type: "UNDO" },
    );

    expect(s.nodeDimensions.has("a")).toBe(false);
  });

  it("SYNC_DAG 建立外部基线且不记录编辑历史", () => {
    const oldSnapshot = {
      flow: ["a"],
      nodeMap: createNodeMap([node("a")]),
      selectedNodes: new Set<string>(),
    };
    const s = canvasReducer(
      stateWith({
        dirty: true,
        flow: ["a"],
        nodeMap: oldSnapshot.nodeMap,
        history: [oldSnapshot],
        future: [oldSnapshot],
      }),
      {
        type: "SYNC_DAG",
        payload: {
          flow: ["b"],
          nodeMap: createNodeMap([node("b")]),
        },
      },
    );

    expect(s.dirty).toBe(false);
    expect(s.history).toEqual([]);
    expect(s.future).toEqual([]);
    expect(s.flow).toEqual(["b"]);
  });
});
