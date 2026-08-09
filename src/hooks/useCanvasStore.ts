import { useContext, useSyncExternalStore } from "react";
import { CanvasInstanceContext } from "../contexts/StoreContext.tsx";
import type { StoreState } from "../types/index.ts";

/** 内部 store selector，避免节点只因其他节点状态变化而重渲染。 */
export default function useCanvasStore<T>(selector: (state: StoreState) => T): T {
  const instance = useContext(CanvasInstanceContext);
  if (!instance) throw new Error("useCanvasStore must be used within a DagFlowProvider or DagFlow");

  return useSyncExternalStore(
    instance.subscribe,
    () => selector(instance.getState()),
    () => selector(instance.getState()),
  );
}
