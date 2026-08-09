import { useContext } from "react";
import { CanvasTransformContext } from "../contexts/StoreContext.tsx";
import type { Viewport } from "../types/index.ts";

/**
 * 当前视口 {x, y, zoom}；平移或缩放时重新渲染消费者。
 */
export default function useViewport(): Viewport {
  const viewport = useContext(CanvasTransformContext);
  if (!viewport) throw new Error("useViewport must be used within a DagFlowProvider or DagFlow");
  return viewport;
}
