import { useContext } from "react";
import { InteractionContext } from "../contexts/StoreContext.tsx";
import type { CanvasInteraction } from "../types/index.ts";

/**
 * 交互回调 hook（React Flow 风格的 onNodeClick / onBeforeDelete / onPaneClick）。
 * 回调由 CanvasProvider 通过 ref 稳定持有，组件在交互时读取最新值。
 */
export default function useCanvasInteraction(): CanvasInteraction {
  const interaction = useContext(InteractionContext);
  if (!interaction)
    throw new Error("useCanvasInteraction must be used within a DagFlowProvider or DagFlow");
  return interaction;
}
