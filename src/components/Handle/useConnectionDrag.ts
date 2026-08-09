import { useCallback, useContext, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { CanvasInstanceContext } from "../../contexts/StoreContext.tsx";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";
import type { XYPosition } from "../../types/index.ts";
import { reconnectNode } from "../../utils/reconnect.ts";

/** 管理 source Handle 发起连接的 Pointer Events 手势。 */
export default function useConnectionDrag(sourceId: string | null) {
  const instance = useContext(CanvasInstanceContext);
  if (!instance) {
    throw new Error("useConnectionDrag must be used within a DagFlowProvider or DagFlow");
  }
  const dispatch = useCanvasDispatch();
  const cleanupRef = useRef<() => void>(() => undefined);

  useEffect(() => () => cleanupRef.current(), []);

  return useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || !sourceId) return;
      const renderer = event.currentTarget.closest(".dag-flow__renderer") as HTMLElement | null;
      if (!renderer) return;

      event.preventDefault();
      event.stopPropagation();
      const rect = renderer.getBoundingClientRect();
      const scaleX = renderer.offsetWidth ? rect.width / renderer.offsetWidth : 1;
      const scaleY = renderer.offsetHeight ? rect.height / renderer.offsetHeight : 1;
      const viewport = instance.getTransform();
      const toCanvas = (clientX: number, clientY: number): XYPosition => ({
        x: (clientX - rect.left - viewport.x) / (scaleX * viewport.zoom),
        y: (clientY - rect.top - viewport.y) / (scaleY * viewport.zoom),
      });
      cleanupRef.current();
      dispatch({
        type: "UPDATE_CONNECTING",
        payload: { edge: { source: sourceId, position: toCanvas(event.clientX, event.clientY) } },
      });

      const cleanup = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("blur", onCancel);
        dispatch({ type: "UPDATE_CONNECTING", payload: { edge: null } });
        cleanupRef.current = () => undefined;
      };
      const onMove = (moveEvent: PointerEvent) => {
        dispatch({
          type: "UPDATE_CONNECTING",
          payload: {
            edge: { source: sourceId, position: toCanvas(moveEvent.clientX, moveEvent.clientY) },
          },
        });
      };
      const onUp = (upEvent: PointerEvent) => {
        cleanup();
        const target = document
          .elementFromPoint(upEvent.clientX, upEvent.clientY)
          ?.closest("[data-node-id]") as HTMLElement | null;
        const targetId = target?.getAttribute("data-node-id");
        if (!targetId || targetId === sourceId) return;
        const nextFlow = reconnectNode(instance.getFlow(), targetId, sourceId);
        if (nextFlow) dispatch({ type: "SET_FLOW", payload: nextFlow });
      };
      const onCancel = () => cleanup();

      cleanupRef.current = cleanup;
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onCancel);
      window.addEventListener("blur", onCancel);
    },
    [dispatch, instance, sourceId],
  );
}
