import { useCallback } from "react";
import useResizeObserver from "./useResizeObserver.ts";
import useCanvasDispatch from "./useCanvasDispatch.ts";

/**
 * 节点尺寸观察（RF NodeWrapper 对齐）：观察节点 DOM，尺寸变化时
 * dispatch SET_NODE_DIMENSIONS（触发布局引擎重算）。
 */
export default function useNodeObserver(
  id: string,
  ref: React.RefObject<HTMLElement | null>,
  enabled = true,
) {
  const dispatch = useCanvasDispatch();

  const handleResize = useCallback(
    (entry: ResizeObserverEntry) => {
      const target = entry.target as HTMLElement;
      const width = target.offsetWidth;
      const height = target.offsetHeight;
      if (!width && !height) return;
      dispatch({
        type: "SET_NODE_DIMENSIONS",
        payload: new Map([[id, { width, height }]]),
      });
    },
    [dispatch, id],
  );

  useResizeObserver(ref, handleResize, enabled);
}
