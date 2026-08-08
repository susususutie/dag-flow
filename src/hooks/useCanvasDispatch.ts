import { useContext } from "react";
import { CanvasDispatchContext } from "../contexts/StoreContext.tsx";
import type { CanvasAction } from "../types/index.ts";

/** 画布 reducer dispatch hook */
export default function useCanvasDispatch(): (action: CanvasAction) => void {
  const dispatch = useContext(CanvasDispatchContext);
  if (!dispatch)
    throw new Error("useCanvasDispatch must be used within a DAGProvider or DAGCanvas");
  return dispatch;
}
