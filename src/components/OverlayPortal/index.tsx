import type { ReactNode } from "react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import useCanvasStore from "../../hooks/useCanvasStore.ts";

export interface OverlayPortalProps {
  children: ReactNode;
}

/** 将内容挂载到画布覆盖层；内容不随 viewport 平移和缩放。 */
export default function OverlayPortal({ children }: OverlayPortalProps) {
  const uid = useCanvasStore((state) => state.uid);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const dagFlow = document.getElementById(uid);
    setPortalElement(dagFlow?.querySelector<HTMLElement>(".dag-flow__overlay-portal") ?? null);
  }, [uid]);

  return portalElement ? createPortal(children, portalElement) : null;
}
