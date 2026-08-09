import type { NodeComponentProps } from "../../types/index.ts";

/** 默认节点只渲染 label，尺寸和视觉样式由节点外层或调用方控制。 */
export default function DefaultNode({ id, data }: NodeComponentProps) {
  const label = data && "label" in data ? (data as { label?: unknown }).label : undefined;
  return typeof label === "string" || typeof label === "number" ? label : id;
}
