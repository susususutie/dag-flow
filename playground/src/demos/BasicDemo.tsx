import { useCallback, useRef } from "react";
import {
  DAGCanvas,
  DAGProvider,
  Background,
  Controls,
  MiniMap,
  useDAGInstance,
  useNodes,
  useViewport,
} from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

/** 基础画布：不可控模式 + 自定义节点 + 附加组件全量挂载 */
export default function BasicDemo() {
  return (
    <DAGProvider>
      <div className="demo-canvas">
        <DAGCanvas
          defaultNodes={BASIC_NODES}
          defaultFlow={BASIC_FLOW}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 40 }}
        >
          <Background color="#1890ff33" size={24} />
          <Controls showZoom zoomStep={10} />
          <MiniMap autoShow pannable zoomable />
          <CanvasStatusBar />
        </DAGCanvas>
        <CanvasActions />
      </div>
    </DAGProvider>
  );
}

function CanvasStatusBar() {
  const nodes = useNodes();
  const viewport = useViewport();

  return (
    <div className="demo-status-bar">
      <span>节点数 {nodes.length}</span>
      <span>
        视口 {viewport.x.toFixed(0)}, {viewport.y.toFixed(0)} / {Math.round(viewport.zoom * 100)}%
      </span>
      <span>选中 {nodes.filter((node) => node.selected).length}</span>
    </div>
  );
}

function CanvasActions() {
  const dag = useDAGInstance();
  const nodeCounter = useRef(0);

  const addNode = useCallback(() => {
    nodeCounter.current += 1;
    const id = `node-${nodeCounter.current}`;
    dag.setDAG((current) => ({
      nodes: [
        ...current.nodes,
        { id, type: "status", data: { label: `新增节点 ${nodeCounter.current}` } },
      ],
      flow: [...current.flow, id],
    }));
  }, [dag]);

  const deleteSelected = useCallback(() => {
    const selected = dag
      .getNodes()
      .filter((node) => node.selected)
      .map((node) => node.id);
    if (selected.length === 0) return;
    void dag.deleteNodes(selected);
  }, [dag]);

  return (
    <div className="demo-actions">
      <button onClick={addNode}>添加节点</button>
      <button onClick={deleteSelected}>删除选中</button>
      <button onClick={() => dag.fitView({ padding: 40 })}>适应视图</button>
      <button onClick={() => dag.zoomIn()}>放大</button>
      <button onClick={() => dag.zoomOut()}>缩小</button>
      <button onClick={() => dag.setViewport({ x: 0, y: 0, zoom: 1 })}>重置视口</button>
    </div>
  );
}
