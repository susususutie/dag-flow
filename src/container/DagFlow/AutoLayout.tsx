import { useEffect, useRef } from "react";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";
import useCanvasState from "../../hooks/useCanvasState.ts";
import useDAGInstance from "../../hooks/useDAGInstance.ts";
import useNodesInitialized from "../../hooks/useNodesInitialized.ts";
import type { LayoutEngine } from "../../types/index.ts";

interface AutoLayoutProps {
  engine?: LayoutEngine;
}

export default function AutoLayout({ engine }: AutoLayoutProps) {
  const dispatch = useCanvasDispatch();
  const dag = useDAGInstance();
  const initialized = useNodesInitialized();
  const { autoLayout, layoutReady } = useCanvasState();
  const previousEngine = useRef(engine);
  const engineChanged = previousEngine.current !== engine;

  useEffect(() => {
    previousEngine.current = engine;
    if (!autoLayout || !initialized || (layoutReady && !engineChanged)) return;

    const controller = new AbortController();
    void dag
      .layout({ engine, signal: controller.signal })
      .then((nextDAG) => {
        if (controller.signal.aborted) return;
        dispatch({
          type: "APPLY_LAYOUT",
          payload: new Map(nextDAG.nodes.map((node) => [node.id, node.position])),
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof Error && error.message === "Layout result is stale") return;
        throw error;
      });

    return () => controller.abort();
  }, [autoLayout, dag, dispatch, engine, engineChanged, initialized, layoutReady]);

  return null;
}
