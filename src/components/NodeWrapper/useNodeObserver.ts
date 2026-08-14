import { useEffect, useRef } from "react";

export default function useNodeObserver(
  resizeObserver: ResizeObserver | null,
  nodeType?: string,
  nodeData?: unknown,
) {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !resizeObserver) return;
    resizeObserver.observe(node);
    return () => resizeObserver.unobserve(node);
  }, [nodeData, nodeType, resizeObserver]);

  return nodeRef;
}
