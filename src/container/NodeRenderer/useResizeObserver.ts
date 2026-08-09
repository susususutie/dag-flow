import { useEffect, useState } from "react";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";

export default function useResizeObserver(): ResizeObserver | null {
  const dispatch = useCanvasDispatch();
  const [observer] = useState<ResizeObserver | null>(() => {
    if (typeof ResizeObserver === "undefined") return null;
    return new ResizeObserver((entries) => {
      const dimensions = new Map<string, { width: number; height: number }>();
      for (const entry of entries) {
        const id = entry.target.getAttribute("data-id");
        if (!id) continue;
        const element = entry.target as HTMLElement;
        dimensions.set(id, { width: element.offsetWidth, height: element.offsetHeight });
      }
      if (dimensions.size > 0) {
        dispatch({ type: "SET_NODE_DIMENSIONS", payload: dimensions });
      }
    });
  });

  useEffect(() => () => observer?.disconnect(), [observer]);
  return observer;
}
