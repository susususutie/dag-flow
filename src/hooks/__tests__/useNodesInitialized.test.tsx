// @vitest-environment jsdom
import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CanvasContext } from "../../contexts/StoreContext.tsx";
import initialState from "../../store/initialState.ts";
import type { CanvasState } from "../../types/index.ts";
import useNodesInitialized from "../useNodesInitialized.ts";

function canvasState(nodeIds: string[], measuredIds: string[]): CanvasState {
  const { transform: _transform, ...state } = initialState;
  return {
    ...state,
    nodeMap: new Map(nodeIds.map((id) => [id, { id, position: { x: 0, y: 0 } }])),
    nodeDimensions: new Map(measuredIds.map((id) => [id, { width: 100, height: 40 }])),
  };
}

describe("useNodesInitialized", () => {
  it("空图返回 false", () => {
    const { result } = renderHook(() => useNodesInitialized(), {
      wrapper: ({ children }) => (
        <CanvasContext.Provider value={canvasState([], [])}>{children}</CanvasContext.Provider>
      ),
    });
    expect(result.current).toBe(false);
  });

  it("所有节点测量后返回 true，新增未测量节点后返回 false", () => {
    function Probe() {
      return <span>{String(useNodesInitialized())}</span>;
    }
    const { rerender } = render(
      <CanvasContext.Provider value={canvasState(["a"], ["a"])}>
        <Probe />
      </CanvasContext.Provider>,
    );
    expect(screen.getByText("true")).toBeTruthy();

    rerender(
      <CanvasContext.Provider value={canvasState(["a", "b"], ["a"])}>
        <Probe />
      </CanvasContext.Provider>,
    );
    expect(screen.getByText("false")).toBeTruthy();
  });
});
