import { describe, expect, it } from "vitest";
import applyNodeChanges from "../changes.ts";

describe("applyNodeChanges", () => {
  it("应用 position change 并保留节点其他字段", () => {
    const nodes = [{ id: "a", data: { label: "A" }, position: { x: 0, y: 0 } }];
    const result = applyNodeChanges(
      [{ type: "position", id: "a", position: { x: 12, y: 24 }, dragging: true }],
      nodes,
    );

    expect(result).toEqual([{ id: "a", data: { label: "A" }, position: { x: 12, y: 24 } }]);
    expect(result[0]).not.toBe(nodes[0]);
  });
});
