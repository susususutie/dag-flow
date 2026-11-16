// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EdgeWrapper from "../index.tsx";

describe("EdgeWrapper", () => {
  it("输出逻辑边 id、状态与圆角路径", () => {
    const { container } = render(
      <svg>
        <EdgeWrapper
          edge={{
            id: "a->b",
            points: [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
            ],
          }}
          state="success"
        />
      </svg>,
    );
    const group = container.querySelector('[data-edge-id="a->b"]');

    expect(group?.getAttribute("data-edge-state")).toBe("success");
    expect(group?.querySelector("path")?.getAttribute("d")).toBe("M0 0L100 0");
  });

  it("未提供状态时回退 default", () => {
    const { container } = render(
      <svg>
        <EdgeWrapper
          edge={{
            id: "a->b",
            points: [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
            ],
          }}
        />
      </svg>,
    );

    expect(container.querySelector('[data-edge-id="a->b"]')?.getAttribute("data-edge-state")).toBe(
      "default",
    );
  });
});
