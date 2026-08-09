import type { ReactNode } from "react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import useCanvasStore from "../../hooks/useCanvasStore.ts";

export interface ViewportPortalProps {
  children: ReactNode;
}

/** 将内容挂载到画布坐标系；内容随 viewport 一起平移和缩放。 */
export default function ViewportPortal({ children }: ViewportPortalProps) {
  const uid = useCanvasStore((state) => state.uid);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const dagFlow = document.getElementById(uid);
    setPortalElement(dagFlow?.querySelector<HTMLElement>(".dag-flow__viewport-portal") ?? null);
  }, [uid]);

  return portalElement ? createPortal(children, portalElement) : null;
}
