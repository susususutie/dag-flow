import { useCallback, useContext, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { CanvasInstanceContext } from "../../contexts/StoreContext.tsx";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";
import type { XYPosition } from "../../types/index.ts";

interface DragState {
  startClientX: number;
  startClientY: number;
  clientX: number;
  clientY: number;
  startPosition: XYPosition;
  scaleX: number;
  scaleY: number;
  zoom: number;
  hasMoved: boolean;
}

const DRAG_THRESHOLD = 3;

function getDragPosition(drag: DragState): XYPosition {
  return {
    x: drag.startPosition.x + (drag.clientX - drag.startClientX) / (drag.scaleX * drag.zoom),
    y: drag.startPosition.y + (drag.clientY - drag.startClientY) / (drag.scaleY * drag.zoom),
  };
}

/** 管理单个节点的 Pointer Events 拖动手势。 */
export default function useNodeDrag(id: string, position: XYPosition, draggable: boolean) {
  const instance = useContext(CanvasInstanceContext);
  if (!instance) throw new Error("useNodeDrag must be used within a DagFlowProvider or DagFlow");

  const dispatch = useCanvasDispatch();
  const dragStateRef = useRef<DragState | null>(null);
  const finishDragRef = useRef<(unmounting?: boolean) => void>(() => undefined);
  const suppressClickUntilRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => finishDragRef.current(true), []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !draggable) return;
      if ((event.target as Element).closest("[data-nodrag], [data-handle]")) return;

      const renderer = event.currentTarget.closest(".dag-flow__renderer") as HTMLElement | null;
      if (!renderer) return;
      const rect = renderer.getBoundingClientRect();
      dragStateRef.current = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        clientX: event.clientX,
        clientY: event.clientY,
        startPosition: position,
        scaleX: renderer.offsetWidth ? rect.width / renderer.offsetWidth : 1,
        scaleY: renderer.offsetHeight ? rect.height / renderer.offsetHeight : 1,
        zoom: instance.getTransform().zoom || 1,
        hasMoved: false,
      };
      event.stopPropagation();
      event.preventDefault();

      const cleanup = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", finishFromEvent);
        document.removeEventListener("pointercancel", finishFromEvent);
        window.removeEventListener("blur", finishFromEvent);
      };
      const onMove = (moveEvent: PointerEvent) => {
        const current = dragStateRef.current;
        if (!current) return;
        current.clientX = moveEvent.clientX;
        current.clientY = moveEvent.clientY;
        if (!current.hasMoved) {
          const distance = Math.hypot(
            current.clientX - current.startClientX,
            current.clientY - current.startClientY,
          );
          if (distance < DRAG_THRESHOLD) return;
          current.hasMoved = true;
          setDragging(true);
        }
        dispatch({
          type: "UPDATE_NODE_POSITION",
          payload: { id, position: getDragPosition(current), dragging: true },
        });
      };
      const finish = (unmounting = false) => {
        const current = dragStateRef.current;
        dragStateRef.current = null;
        cleanup();
        if (!unmounting) setDragging(false);
        if (!current?.hasMoved) return;
        suppressClickUntilRef.current = performance.now() + 100;
        dispatch({
          type: "UPDATE_NODE_POSITION",
          payload: {
            id,
            position: getDragPosition(current),
            dragging: false,
            origin: current.startPosition,
          },
        });
      };
      const finishFromEvent = () => finish();
      finishDragRef.current = finish;
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", finishFromEvent);
      document.addEventListener("pointercancel", finishFromEvent);
      window.addEventListener("blur", finishFromEvent);
    },
    [dispatch, draggable, id, instance, position],
  );
  const shouldSuppressClick = useCallback(
    () => performance.now() < suppressClickUntilRef.current,
    [],
  );

  return {
    dragging,
    onPointerDown,
    shouldSuppressClick,
  };
}
