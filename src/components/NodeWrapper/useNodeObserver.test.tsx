// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import useNodeObserver from "./useNodeObserver.ts";

function ObservedNode({ observer, nodeType }: { observer: ResizeObserver; nodeType: string }) {
  const ref = useNodeObserver(observer, nodeType);
  return <div ref={ref} />;
}

describe("useNodeObserver", () => {
  it("节点渲染输入变化时重新注册尺寸观察", () => {
    const observe = vi.fn();
    const unobserve = vi.fn();
    const observer = {
      observe,
      unobserve,
    } as unknown as ResizeObserver;
    const view = render(<ObservedNode observer={observer} nodeType="old" />);

    expect(observe).toHaveBeenCalledTimes(1);
    view.rerender(<ObservedNode observer={observer} nodeType="next" />);
    expect(unobserve).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledTimes(2);

    view.unmount();
    expect(unobserve).toHaveBeenCalledTimes(2);
  });
});
