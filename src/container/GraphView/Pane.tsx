import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import useCanvasState from "../../hooks/useCanvasState.ts";
import useCanvasInteraction from "../../hooks/useCanvasInteraction.ts";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";
import useRafCanvasDispatch from "../../hooks/useRafCanvasDispatch.ts";
import useKeyPress from "../../hooks/useKeyPress.ts";

const WHEEL_PAN_SPEED = 0.5;
const CLICK_MOVE_THRESHOLD = 5;

function shouldPan(e: { ctrlKey: boolean; metaKey: boolean }, modifier: string): boolean {
  if (modifier.toLowerCase() === "none") return true;
  if (modifier.toLowerCase() === "ctrl") return e.ctrlKey;
  if (modifier.toLowerCase() === "meta") return e.metaKey;
  return false;
}

/** 平移层：左键拖拽平移、滚轮平移、空白处点击判定（对应 React Flow Pane） */
export default function Pane({ children }: { children: ReactNode }) {
  const dispatch = useCanvasDispatch();
  const dispatchOnAnimationFrame = useRafCanvasDispatch();
  const [isPanning, setIsPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const panRef = useRef<HTMLDivElement>(null);

  const { panOnScroll, panScrollModifier, panOnDrag, panDragModifier } = useCanvasState();
  const { onPaneClick } = useCanvasInteraction();
  const downPosRef = useRef<{ x: number; y: number } | null>(null);
  const panDragModifierRef = useRef(panDragModifier);
  panDragModifierRef.current = panDragModifier;
  const panScrollModifierRef = useRef(panScrollModifier);
  panScrollModifierRef.current = panScrollModifier;

  const [isMetaHeld, setIsMetaHeld] = useState(false);
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);
  useKeyPress(
    ["meta", "ctrl"],
    (e, key) => {
      if (key === "meta") {
        setIsMetaHeld(e.metaKey);
      }
      if (key === "ctrl") {
        setIsCtrlHeld(e.ctrlKey);
      }
    },
    { events: ["keydown", "keyup"], exclude: true },
  );

  const panOnScrollRef = useRef(panOnScroll);
  panOnScrollRef.current = panOnScroll;
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!panOnScrollRef.current) return;
      e.preventDefault();
      if (!shouldPan(e, panScrollModifierRef.current)) return;
      dispatchOnAnimationFrame({
        type: "PAN_BY",
        payload: { dx: -e.deltaX * WHEEL_PAN_SPEED, dy: -e.deltaY * WHEEL_PAN_SPEED },
      });
    },
    [dispatchOnAnimationFrame],
  );
  useEffect(() => {
    const el = panRef.current;
    if (!el) return;
    if (panOnScroll) {
      el.addEventListener("wheel", handleWheel, { passive: false });
      return () => el.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel, panOnScroll]);

  const handleMouseDownCapture = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      if ((e.target as Element).closest("[data-nopan]")) return;

      downPosRef.current = { x: e.clientX, y: e.clientY };
      if (!panOnDrag || !shouldPan(e, panDragModifierRef.current)) return;

      e.stopPropagation();
      e.preventDefault();
      setIsPanning(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [panOnDrag],
  );

  // 点击画布空白区域（React Flow onPaneClick）：排除拖拽与节点点击
  const handlePaneClick = useCallback(
    (e: React.MouseEvent) => {
      const down = downPosRef.current;
      downPosRef.current = null;
      if (!down) return;
      if (
        Math.abs(e.clientX - down.x) > CLICK_MOVE_THRESHOLD ||
        Math.abs(e.clientY - down.y) > CLICK_MOVE_THRESHOLD
      ) {
        return;
      }
      dispatch({ type: "CLEAR_SELECTION" });
      onPaneClick?.(e as unknown as MouseEvent);
    },
    [dispatch, onPaneClick],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      if (!shouldPan(e, panDragModifierRef.current)) {
        setIsPanning(false);
        return;
      }

      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      dispatchOnAnimationFrame({ type: "PAN_BY", payload: { dx, dy } });
    },
    [isPanning, dispatchOnAnimationFrame],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const cursorStyle = useMemo(() => {
    if (isPanning) return "grabbing";
    if (panOnScroll) return "grab";
    if (
      panOnDrag &&
      (panDragModifier.toLowerCase() === "none" ||
        (isMetaHeld && panDragModifier.toLowerCase() === "meta") ||
        (isCtrlHeld && panDragModifier.toLowerCase() === "ctrl"))
    )
      return "grab";
    return undefined;
  }, [isCtrlHeld, isMetaHeld, isPanning, panDragModifier, panOnDrag, panOnScroll]);

  return (
    <div
      ref={panRef}
      className="dag-flow__pane"
      style={{ cursor: cursorStyle }}
      data-testid="pan"
      onMouseDownCapture={handleMouseDownCapture}
      onClick={handlePaneClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {children}
    </div>
  );
}
