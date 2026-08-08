import { useContext } from "react";
import { CanvasTransformContext } from "../contexts/StoreContext.tsx";
import type { Viewport } from "../types/index.ts";

/**
 * 高频变化的画布视口状态，与拓扑和业务状态分开订阅。
 * @returns 当前视口 {x, y, zoom}
 */
export default function useCanvasTransform(): Viewport {
  return useContext(CanvasTransformContext) ?? { x: 0, y: 0, zoom: 1 };
}
