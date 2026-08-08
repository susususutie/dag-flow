import { useContext } from "react";
import { NodeContext } from "../contexts/StoreContext.tsx";
import type { NodeComponentProps } from "../types/index.ts";

/** 节点 hook：在自定义节点组件内读取当前节点上下文（与组件 props 等价） */
export default function useNode(): Partial<NodeComponentProps> {
  return useContext(NodeContext);
}
