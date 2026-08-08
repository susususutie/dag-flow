import { useCallback, useState } from "react";
import { DAGCanvas, DAGProvider, useDAGInstance, useViewport } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** 视口实例 API：fitView / zoomIn / zoomOut / zoomTo / setViewport / getViewport */
export default function ViewControlDemo() {
  return (
    <DAGProvider>
      <div className="demo-scene">
        <div className="demo-controls">
          <ControlsBar />
        </div>
        <div className="demo-canvas">
          <DAGCanvas
            defaultNodes={BASIC_NODES}
            defaultFlow={BASIC_FLOW}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 40 }}
          >
            <ViewportBar />
          </DAGCanvas>
        </div>
        <LogBar />
      </div>
    </DAGProvider>
  );
}

function ControlsBar() {
  const dag = useDAGInstance();
  const [logs, setLogs] = useState<string[]>([]);

  const record = useCallback(() => {
    const v = dag.getViewport();
    setLogs((prev) =>
      [
        `getViewport: x=${v.x.toFixed(0)} y=${v.y.toFixed(0)} zoom=${v.zoom.toFixed(2)}`,
        ...prev,
      ].slice(0, 5),
    );
  }, [dag]);

  return (
    <>
      <button onClick={() => dag.fitView({ padding: 20 })}>fitView(20)</button>
      <button onClick={() => dag.zoomIn()}>zoomIn</button>
      <button onClick={() => dag.zoomOut()}>zoomOut</button>
      <button onClick={() => dag.zoomTo(1.5)}>zoomTo(1.5)</button>
      <button onClick={() => dag.setViewport({ x: 80, y: 120, zoom: 1.2 })}>
        setViewport(80,120,1.2)
      </button>
      <button onClick={() => dag.setViewport({ zoom: 1 })}>setViewport(zoom:1)</button>
      <button onClick={record}>getViewport</button>
      <LogList logs={logs} />
    </>
  );
}

function ViewportBar() {
  const viewport = useViewport();
  return (
    <div className="demo-status-bar">
      <span>
        当前视口 {viewport.x.toFixed(0)}, {viewport.y.toFixed(0)} /{" "}
        {Math.round(viewport.zoom * 100)}%
      </span>
    </div>
  );
}

function LogBar() {
  return (
    <div className="demo-actions">
      <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", lineHeight: "20px" }}>
        getViewport 调用结果记录见上方控件区
      </span>
    </div>
  );
}

function LogList({ logs }: { logs: string[] }) {
  if (logs.length === 0) return null;
  return <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{logs.join(" | ")}</span>;
}
