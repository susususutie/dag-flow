import { useEffect, useRef } from "react";

export default function useNodeObserver(resizeObserver: ResizeObserver | null) {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !resizeObserver) return;
    resizeObserver.observe(node);
    return () => resizeObserver.unobserve(node);
  }, [resizeObserver]);

  return nodeRef;
}
