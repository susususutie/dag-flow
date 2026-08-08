import { useCallback, useEffect, useRef } from "react";
import useCanvasDispatch from "./useCanvasDispatch.ts";
import type { CanvasAction } from "../types/index.ts";

/**
 * 将同一渲染帧内的连续画布操作合并为一次 reducer 更新。
 */
export default function useRafCanvasDispatch() {
  const dispatch = useCanvasDispatch();
  const queueRef = useRef<CanvasAction[]>([]);
  const frameRef = useRef<number | null>(null);

  const dispatchOnAnimationFrame = useCallback(
    (action: CanvasAction) => {
      queueRef.current.push(action);
      if (frameRef.current !== null) return;

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const actions = queueRef.current;
        queueRef.current = [];
        dispatch({ type: "BATCH", payload: actions });
      });
    },
    [dispatch],
  );

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  return dispatchOnAnimationFrame;
}
