// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { createRef, useLayoutEffect } from "react";
import { describe, expect, it } from "vitest";
import CanvasProvider from "../CanvasProvider.tsx";
import type { DAGInstance, LayoutEngine } from "../../types/index.ts";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";

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
