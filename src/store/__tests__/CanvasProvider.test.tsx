// @vitest-environment jsdom
import { act, render, waitFor } from "@testing-library/react";
import { createRef, useLayoutEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import CanvasProvider from "../CanvasProvider.tsx";
import type { CanvasAction, DAGInstance, LayoutEngine } from "../../types/index.ts";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";
import AutoLayout from "../../container/DagFlow/AutoLayout.tsx";

function MeasureNode() {
  const dispatch = useCanvasDispatch();
  useLayoutEffect(() => {
    dispatch({
      type: "SET_NODE_DIMENSIONS",
      payload: new Map([["a", { width: 100, height: 40 }]]),
    });
  }, [dispatch]);
  return null;
}

function MeasureNodes({ ids }: { ids: string[] }) {
  const dispatch = useCanvasDispatch();
  useLayoutEffect(() => {
    dispatch({
      type: "SET_NODE_DIMENSIONS",
      payload: new Map(ids.map((id) => [id, { width: 100, height: 40 }])),
    });
  }, [dispatch, ids]);
  return null;
}

describe("DAGInstance.layout", () => {
  it("返回完整 DAG 且不修改画布节点", async () => {
    const ref = createRef<DAGInstance>();
    const engine: LayoutEngine = ({ nodes, flow }) => {
      expect(nodes.map((node) => node.id)).toEqual(["a"]);
      expect(flow).toEqual(["a"]);
      return { positions: new Map([["a", { x: 20, y: 30 }]]) };
    };

    render(
      <CanvasProvider
        ref={ref}
        defaultNodes={[{ id: "a", data: { label: "A" } }]}
        flow={["a"]}
        layoutEngine={engine}
      >
        <MeasureNode />
      </CanvasProvider>,
    );

    expect(ref.current?.getNode("a")?.position).toEqual({ x: 0, y: 0 });
    let result;
    await act(async () => {
      result = await ref.current?.layout();
    });

    expect(result).toEqual({
      nodes: [{ id: "a", data: { label: "A" }, position: { x: 20, y: 30 } }],
      flow: ["a"],
    });
    expect(ref.current?.getNode("a")?.position).toEqual({ x: 0, y: 0 });
  });
});

describe("默认自动布局", () => {
  it("拓扑变化后自动重排且保持视口", async () => {
    const ref = createRef<DAGInstance>();
    const ids = ["start", "a", "b", "c", "d", "done"];
    render(
      <CanvasProvider
        ref={ref}
        defaultNodes={ids.map((id) => ({ id, position: { x: 0, y: 0 } }))}
        defaultFlow={["start", [["a"], ["b"], ["c"], ["d"]], "done"]}
      >
        <MeasureNodes ids={ids} />
        <AutoLayout />
      </CanvasProvider>,
    );

    await waitFor(() => expect(ref.current?.getNode("d")?.position.y).toBe(64));

    act(() => ref.current?.setViewport({ x: -462, y: 133, zoom: 2 }));
    await act(async () => {
      await ref.current?.deleteNode("d");
    });

    await waitFor(() => expect(ref.current?.getNode("a")?.position.y).toBe(-76));
    expect(ref.current?.getNode("b")?.position.y).toBe(-20);
    expect(ref.current?.getNode("c")?.position.y).toBe(36);
    expect(ref.current?.getNode("start")?.position.y).toBe(-20);
    expect(ref.current?.getNode("done")?.position.y).toBe(-20);
    expect(ref.current?.getViewport()).toEqual({ x: -462, y: 133, zoom: 2 });
  });
});

function DispatchAction({
  action,
}: {
  action: Parameters<ReturnType<typeof useCanvasDispatch>>[0];
}) {
  const dispatch = useCanvasDispatch();
  useLayoutEffect(() => dispatch(action), [action, dispatch]);
  return null;
}

function DispatchActions({ actions }: { actions: CanvasAction[] }) {
  const dispatch = useCanvasDispatch();
  useLayoutEffect(() => {
    actions.forEach(dispatch);
  }, [actions, dispatch]);
  return null;
}

describe("CanvasProvider 图变更通知", () => {
  it("SET_FLOW 触发 onFlowChange", () => {
    const onFlowChange = vi.fn();
    render(
      <CanvasProvider
        defaultNodes={[
          { id: "a", position: { x: 0, y: 0 } },
          { id: "b", position: { x: 0, y: 0 } },
        ]}
        defaultFlow={["a", "b"]}
        onFlowChange={onFlowChange}
      >
        <DispatchAction action={{ type: "SET_FLOW", payload: ["b", "a"] }} />
      </CanvasProvider>,
    );

    expect(onFlowChange).toHaveBeenCalledWith(["b", "a"], { reason: "update" });
  });

  it("撤销和重做向受控回调发送恢复后的节点", () => {
    const onNodesChange = vi.fn();
    const actions: CanvasAction[] = [
      {
        type: "SET_DAG",
        payload: {
          nodeMap: new Map([["a", { id: "a", position: { x: 20, y: 30 } }]]),
          flow: ["a"],
        },
      },
      { type: "UNDO" },
      { type: "REDO" },
    ];
    render(
      <CanvasProvider
        defaultNodes={[{ id: "a", position: { x: 0, y: 0 } }]}
        defaultFlow={["a"]}
        onNodesChange={onNodesChange}
      >
        <DispatchActions actions={actions} />
      </CanvasProvider>,
    );

    expect(onNodesChange).toHaveBeenCalledTimes(3);
    expect(onNodesChange.mock.calls[1][0]).toEqual([
      { type: "replace", id: "a", item: { id: "a", position: { x: 0, y: 0 } } },
    ]);
    expect(onNodesChange.mock.calls[2][0]).toEqual([
      { type: "replace", id: "a", item: { id: "a", position: { x: 20, y: 30 } } },
    ]);
  });
});
