import { useContext, useLayoutEffect } from "react";
import { CanvasInstanceContext } from "../../contexts/StoreContext.tsx";
import type { CanvasConfigProps } from "../../types/index.ts";

/**
 * 将 DagFlow 的受控数据、默认数据和画布配置同步到当前 store。
 */
export default function StoreUpdater(props: CanvasConfigProps) {
  const instance = useContext(CanvasInstanceContext);

  const {
    uid,
    defaultViewport,
    flow,
    defaultFlow,
    nodes,
    defaultNodes,
    nodesSelectable,
    nodesDraggable,
    direction,
    minZoom,
    maxZoom,
    fitView,
    fitViewOptions,
    zoomOnScroll,
    zoomModifier,
    panOnScroll,
    panScrollModifier,
    panOnDrag,
    panDragModifier,
    onNodesChange,
    onFlowChange,
    onNodeClick,
    onBeforeDelete,
    onSelectionChange,
    onPaneClick,
    onMove,
    nodeTypes,
    layoutEngine,
  } = props;

  useLayoutEffect(() => {
    instance?.configure({
      uid,
      defaultViewport,
      flow,
      defaultFlow,
      nodes,
      defaultNodes,
      nodesSelectable,
      nodesDraggable,
      direction,
      minZoom,
      maxZoom,
      fitView,
      fitViewOptions,
      zoomOnScroll,
      zoomModifier,
      panOnScroll,
      panScrollModifier,
      panOnDrag,
      panDragModifier,
      onNodesChange,
      onFlowChange,
      onNodeClick,
      onBeforeDelete,
      onSelectionChange,
      onPaneClick,
      onMove,
      nodeTypes,
      layoutEngine,
    });
  }, [
    instance,
    uid,
    defaultViewport,
    flow,
    defaultFlow,
    nodes,
    defaultNodes,
    nodesSelectable,
    nodesDraggable,
    direction,
    minZoom,
    maxZoom,
    fitView,
    fitViewOptions,
    zoomOnScroll,
    zoomModifier,
    panOnScroll,
    panScrollModifier,
    panOnDrag,
    panDragModifier,
    onNodesChange,
    onFlowChange,
    onNodeClick,
    onBeforeDelete,
    onSelectionChange,
    onPaneClick,
    onMove,
    nodeTypes,
    layoutEngine,
  ]);

  return null;
}
