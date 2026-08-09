import { useCallback, useState } from "react";
import { DagFlow, ViewportPortal, useViewport } from "dag-flow";
import type { Viewport } from "dag-flow";
import { PARALLEL_FLOW, PARALLEL_NODES, nodeTypes } from "./shared.tsx";

/** defaultViewport 初始视口 + onMove 视口变更监听 */
export default function ViewportDemo() {
  const [logs, setLogs] = useState<string[]>([]);

  const onMove = useCallback((_event: MouseEvent | null, viewport: Viewport) => {
    setLogs((prev) =>
      [
        `move: x=${viewport.x.toFixed(0)} y=${viewport.y.toFixed(0)} zoom=${viewport.zoom.toFixed(2)}`,
        ...prev,
      ].slice(0, 6),
    );
  }, []);

  return (
    <div className="demo-controlled">
      <div className="demo-canvas">
        <DagFlow
          defaultNodes={PARALLEL_NODES}
          defaultFlow={PARALLEL_FLOW}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 60, y: 80, zoom: 0.9 }}
          onMove={onMove}
          style={{ background: "#fafafa" }}
        >
          <ViewportPortal>
            <div
              className="demo-viewport-marker"
              style={{ position: "absolute", transform: "translate(100px, 100px)" }}
            >
              [100, 100]
            </div>
          </ViewportPortal>
          <CurrentViewport />
        </DagFlow>
      </div>
      <aside className="demo-panel">
        <h3>onMove 日志</h3>
        <ul className="demo-log">
          {logs.map((log, index) => (
            <li key={`${index}-${log}`}>{log}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function CurrentViewport() {
  const viewport = useViewport();
  return (
    <div className="demo-status-bar">
      <span>
        视口 {viewport.x.toFixed(1)}, {viewport.y.toFixed(1)} / {Math.round(viewport.zoom * 100)}%
      </span>
      <span>缩放/拖拽画布触发 onMove</span>
    </div>
  );
}
