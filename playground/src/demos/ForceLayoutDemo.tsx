import { useCallback, useState } from "react";
import { DAGCanvas, DAGProvider, useDAGInstance } from "dag-flow";
import type { XYPosition } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/**
 * layout() 强制重排：拖动节点焊死位置后，点击重排按钮无视焊死全量重算。
 * onLayoutChange 每次布局结果（自动 / 强制）都会通知。
 */
export default function ForceLayoutDemo() {
  const [logs, setLogs] = useState<string[]>([]);

  const record = useCallback((positions: Map<string, XYPosition>) => {
    setLogs((prev) => {
      const ids = Array.from(positions.keys());
      return [`布局结果节点数 ${ids.length}（${ids.slice(0, 4).join(", ")}…）`, ...prev].slice(
        0,
        3,
      );
    });
  }, []);

  return (
    <DAGProvider>
      <div className="demo-scene">
        <div className="demo-controls">
          <LayoutBar />
        </div>
        <div className="demo-canvas">
          <DAGCanvas
            defaultNodes={BASIC_NODES}
            defaultFlow={BASIC_FLOW}
            nodeTypes={nodeTypes}
            onLayoutChange={record}
            fitView
            fitViewOptions={{ padding: 40, horizontalAlign: "left", verticalAlign: "top" }}
          />
        </div>
        <div className="demo-actions">
          <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
            {logs.length > 0 ? logs.join(" ｜ ") : "onLayoutChange 尚未触发"}
          </span>
        </div>
      </div>
    </DAGProvider>
  );
}

function LayoutBar() {
  const dag = useDAGInstance();
  return (
    <>
      <button onClick={() => dag.layout()}>layout() 强制重排</button>
      <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
        先拖动节点（焊死），再点击重排即可复位
      </span>
    </>
  );
}
