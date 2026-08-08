import { useContext } from "react";
import { CanvasContext } from "../contexts/StoreContext.tsx";
import type { CanvasState } from "../types/index.ts";

/**
 * 画布状态 hook（不含 transform，视口状态请使用 useViewport / useCanvasTransform）。
 * @returns 画布状态；在 CanvasProvider 之外使用时返回空对象
 */
export default function useCanvasState(): CanvasState {
  const value = useContext(CanvasContext);
  if (value === undefined) {
    return {} as CanvasState;
  }
  return value;
}
