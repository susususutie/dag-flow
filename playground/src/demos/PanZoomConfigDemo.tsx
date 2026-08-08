import { useState } from "react";
import { DAGCanvas } from "dag-flow";
import type { Modifier } from "dag-flow";
import { PARALLEL_FLOW, PARALLEL_NODES, nodeTypes } from "./shared.tsx";

/** 缩放平移配置：zoomOnScroll / zoomModifier / panOnScroll / panScrollModifier / panOnDrag / panDragModifier */
export default function PanZoomConfigDemo() {
  const [zoomOnScroll, setZoomOnScroll] = useState(true);
  const [zoomModifier, setZoomModifier] = useState<Modifier>("none");
  const [panOnScroll, setPanOnScroll] = useState(false);
  const [panScrollModifier, setPanScrollModifier] = useState<Modifier>("none");
  const [panOnDrag, setPanOnDrag] = useState(true);
  const [panDragModifier, setPanDragModifier] = useState<Modifier>("none");

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        <label>
          滚轮缩放
          <input
            type="checkbox"
            checked={zoomOnScroll}
            onChange={(e) => setZoomOnScroll(e.target.checked)}
          />
        </label>
        <label>
          缩放修饰键
          <select
            value={zoomModifier}
            onChange={(e) => setZoomModifier(e.target.value as Modifier)}
          >
            <option value="none">无</option>
            <option value="ctrl">Ctrl</option>
            <option value="meta">Meta</option>
          </select>
        </label>
        <label>
          滚轮平移
          <input
            type="checkbox"
            checked={panOnScroll}
            onChange={(e) => setPanOnScroll(e.target.checked)}
          />
        </label>
        <label>
          平移修饰键
          <select
            value={panScrollModifier}
            onChange={(e) => setPanScrollModifier(e.target.value as Modifier)}
          >
            <option value="none">无</option>
            <option value="ctrl">Ctrl</option>
            <option value="meta">Meta</option>
          </select>
        </label>
        <label>
          拖拽平移
          <input
            type="checkbox"
            checked={panOnDrag}
            onChange={(e) => setPanOnDrag(e.target.checked)}
          />
        </label>
        <label>
          拖拽修饰键
          <select
            value={panDragModifier}
            onChange={(e) => setPanDragModifier(e.target.value as Modifier)}
          >
            <option value="none">无</option>
            <option value="ctrl">Ctrl</option>
            <option value="meta">Meta</option>
          </select>
        </label>
      </div>
      <div className="demo-canvas">
        <DAGCanvas
          defaultNodes={PARALLEL_NODES}
          defaultFlow={PARALLEL_FLOW}
          nodeTypes={nodeTypes}
          zoomOnScroll={zoomOnScroll}
          zoomModifier={zoomModifier}
          panOnScroll={panOnScroll}
          panScrollModifier={panScrollModifier}
          panOnDrag={panOnDrag}
          panDragModifier={panDragModifier}
          fitView
          fitViewOptions={{ padding: 40 }}
        />
      </div>
    </div>
  );
}
