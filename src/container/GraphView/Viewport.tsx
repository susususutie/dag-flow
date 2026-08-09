import type { ReactNode } from "react";
import useCanvasTransform from "../../hooks/useCanvasTransform.ts";

/**
 * 视口层：消费 transform 状态，将 CanvasProvider 中的 transform (x, y, zoom) 映射为 CSS transform。
 * transformOrigin 必须为 '0 0'（左上角），与 canvasReducer 中 ZOOM/PAN 的坐标计算方式保持一致。
 */
export default function Viewport({ children }: { children: ReactNode }) {
  const { x, y, zoom } = useCanvasTransform();

  return (
    <div
      className="dag-flow__viewport"
      style={{ transform: `translate(${x}px, ${y}px) scale(${zoom})` }}
    >
      {children}
      <div className="dag-flow__viewport-portal" />
    </div>
  );
}
