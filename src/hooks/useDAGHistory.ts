import { useCallback, useMemo } from "react";
import useCanvasDispatch from "./useCanvasDispatch.ts";
import useCanvasState from "./useCanvasState.ts";

export interface DAGHistory {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

/** 订阅当前画布的撤销/重做状态，并提供历史操作。 */
export default function useDAGHistory(): DAGHistory {
  const dispatch = useCanvasDispatch();
  const { history, future } = useCanvasState();
  const undo = useCallback(() => dispatch({ type: "UNDO" }), [dispatch]);
  const redo = useCallback(() => dispatch({ type: "REDO" }), [dispatch]);
  const clearHistory = useCallback(() => dispatch({ type: "CLEAR_HISTORY" }), [dispatch]);

  return useMemo(
    () => ({
      canUndo: history.length > 0,
      canRedo: future.length > 0,
      undoCount: history.length,
      redoCount: future.length,
      undo,
      redo,
      clearHistory,
    }),
    [clearHistory, future.length, history.length, redo, undo],
  );
}
