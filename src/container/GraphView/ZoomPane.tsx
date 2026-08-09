import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { ReactNode } from "react";
import useCanvasState from "../../hooks/useCanvasState.ts";
import useRafCanvasDispatch from "../../hooks/useRafCanvasDispatch.ts";

const ZOOM_STEP = 0.005;

function shouldZoom(e: WheelEvent, zoomModifier: string): boolean {
  if (zoomModifier.toLowerCase() === "none") return true;
  if (zoomModifier.toLowerCase() === "ctrl" && e.ctrlKey) return true;
  if (zoomModifier.toLowerCase() === "meta" && e.metaKey) return true;
  return false;
}

/** 缩放层：监听滚轮，围绕鼠标位置缩放（对应 React Flow ZoomPane） */
interface ZoomPaneProps {
  children: ReactNode;
}

const ZoomPane = forwardRef<HTMLDivElement, ZoomPaneProps>(function ZoomPane({ children }, ref) {
  const dispatchOnAnimationFrame = useRafCanvasDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement, []);

  const state = useCanvasState();
  const stateRef = useRef(state);
  stateRef.current = state;

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!stateRef.current.zoomOnScroll) return;
      e.preventDefault();

      if (!shouldZoom(e, stateRef.current.zoomModifier)) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = -e.deltaY * ZOOM_STEP;
      dispatchOnAnimationFrame({ type: "ZOOM", payload: { delta, mouseX, mouseY } });
    },
    [dispatchOnAnimationFrame],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (state.zoomOnScroll) {
      el.addEventListener("wheel", handleWheel, { passive: false });
      return () => el.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel, state.zoomOnScroll]);

  return (
    <div ref={containerRef} className="dag-flow__renderer">
      {children}
    </div>
  );
});

export default memo(ZoomPane);
