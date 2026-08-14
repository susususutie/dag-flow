// @vitest-environment jsdom
import { fireEvent, render, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import CanvasProvider from "../../store/CanvasProvider.tsx";
import useKeyboardHook from "../useKeyboardHook.ts";
import type { NodeChanges } from "../../types/index.ts";

function KeyboardTarget({ testId }: { testId: string }) {
  const target = useRef<HTMLDivElement>(null);
  useKeyboardHook({ target });
  return <div ref={target} data-testid={testId} tabIndex={-1} />;
}

function TestCanvas({
  testId,
  onNodesChange,
}: {
  testId: string;
  onNodesChange: (changes: NodeChanges) => void;
}) {
  return (
    <CanvasProvider
      defaultNodes={[{ id: testId, selected: true, position: { x: 0, y: 0 } }]}
      defaultFlow={[testId]}
      onNodesChange={onNodesChange}
    >
      <KeyboardTarget testId={testId} />
    </CanvasProvider>
  );
}

describe("useKeyboardHook", () => {
  it("快捷键只作用于接收事件的画布", async () => {
    const firstChange = vi.fn();
    const secondChange = vi.fn();
    const view = render(
      <>
        <TestCanvas testId="first" onNodesChange={firstChange} />
        <TestCanvas testId="second" onNodesChange={secondChange} />
      </>,
    );

    fireEvent.keyDown(window, { key: "Delete" });
    expect(firstChange).not.toHaveBeenCalled();
    expect(secondChange).not.toHaveBeenCalled();

    fireEvent.keyDown(view.getByTestId("first"), { key: "Delete" });
    await waitFor(() => expect(firstChange).toHaveBeenCalled());
    expect(secondChange).not.toHaveBeenCalled();
  });
});
