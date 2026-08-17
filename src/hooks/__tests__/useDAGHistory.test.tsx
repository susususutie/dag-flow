// @vitest-environment jsdom
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CanvasProvider from "../../store/CanvasProvider.tsx";
import useDAGHistory from "../useDAGHistory.ts";
import useDAGInstance from "../useDAGInstance.ts";
import useNodes from "../useNodes.ts";

function HistoryControls() {
  const dag = useDAGInstance();
  const nodes = useNodes();
  const { canUndo, canRedo, undoCount, redoCount, undo, redo, clearHistory } = useDAGHistory();

  return (
    <>
      <button onClick={() => dag.deleteNode("b")}>删除 B</button>
      <button disabled={!canUndo} onClick={undo}>
        撤销
      </button>
      <button disabled={!canRedo} onClick={redo}>
        重做
      </button>
      <button onClick={clearHistory}>清空历史</button>
      <span data-testid="nodes">{nodes.map((node) => node.id).join(",")}</span>
      <span data-testid="history">
        {undoCount}/{redoCount}
      </span>
    </>
  );
}

describe("useDAGHistory", () => {
  it("提供可观察的撤销、重做和清空历史状态", async () => {
    const view = render(
      <CanvasProvider
        defaultNodes={[
          { id: "a", position: { x: 0, y: 0 } },
          { id: "b", position: { x: 100, y: 0 } },
        ]}
        defaultFlow={["a", "b"]}
      >
        <HistoryControls />
      </CanvasProvider>,
    );

    expect((view.getByRole("button", { name: "撤销" }) as HTMLButtonElement).disabled).toBe(true);
    expect((view.getByRole("button", { name: "重做" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(view.getByRole("button", { name: "删除 B" }));
    await waitFor(() => expect(view.getByTestId("nodes").textContent).toBe("a"));
    expect(view.getByTestId("history").textContent).toBe("1/0");

    fireEvent.click(view.getByRole("button", { name: "撤销" }));
    await waitFor(() => expect(view.getByTestId("nodes").textContent).toBe("a,b"));
    expect(view.getByTestId("history").textContent).toBe("0/1");

    fireEvent.click(view.getByRole("button", { name: "重做" }));
    await waitFor(() => expect(view.getByTestId("nodes").textContent).toBe("a"));
    expect(view.getByTestId("history").textContent).toBe("1/0");

    fireEvent.click(view.getByRole("button", { name: "清空历史" }));
    await waitFor(() => expect(view.getByTestId("history").textContent).toBe("0/0"));
  });
});
