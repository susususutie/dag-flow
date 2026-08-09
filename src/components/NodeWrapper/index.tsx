import { memo, useCallback } from "react";
import type { HTMLAttributes, MouseEvent as ReactMouseEvent } from "react";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";
import useCanvasInteraction from "../../hooks/useCanvasInteraction.ts";
import useCanvasStore from "../../hooks/useCanvasStore.ts";
import { NodeIdContext } from "../../contexts/NodeIdContext.tsx";
import Handle from "../Handle/index.tsx";
import DefaultNode from "../Nodes/DefaultNode.tsx";
import useNodeDrag from "./useNodeDrag.ts";
import useNodeObserver from "./useNodeObserver.ts";
import { Position } from "../../types/index.ts";
import type { NodeComponentProps } from "../../types/index.ts";

interface NodeWrapperProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  resizeObserver: ResizeObserver | null;
}

const ORIGIN = { x: 0, y: 0 };

/** 单层节点容器：负责定位、测量、选择和组合节点内容。 */
function NodeWrapper({ id, resizeObserver, ...rest }: NodeWrapperProps) {
  const node = useCanvasStore((state) => state.nodeMap.get(id));
  const nodeTypes = useCanvasStore((state) => state.nodeTypes);
  const measured = useCanvasStore((state) => state.nodeDimensions.has(id));
  const nodesSelectable = useCanvasStore((state) => state.nodesSelectable);
  const nodesDraggable = useCanvasStore((state) => state.nodesDraggable);
  const direction = useCanvasStore((state) => state.direction);
  const isSelected = useCanvasStore((state) => state.selectedNodes.has(id));
  const dispatch = useCanvasDispatch();
  const { onNodeClick } = useCanvasInteraction();
  const ref = useNodeObserver(resizeObserver);
  const position = node?.position ?? ORIGIN;
  const draggable = node?.draggable ?? nodesDraggable;
  const nodeDrag = useNodeDrag(id, position, draggable);

  if (!node?.position) throw new Error(`Node "${id}" is missing from the DAG`);
  const { type, data } = node;
  const selectable = node.selectable ?? nodesSelectable;

  const handleClick = useCallback(
    (event: ReactMouseEvent) => {
      if ((event.target as Element).closest("[data-nodrag], [data-handle]")) return;
      if (nodeDrag.shouldSuppressClick()) return;
      if (selectable) dispatch({ type: "UPDATE_SELECTED_NODE", payload: { id } });
      onNodeClick?.(event as unknown as MouseEvent, { ...node, selectable });
    },
    [dispatch, id, node, nodeDrag.shouldSuppressClick, onNodeClick, selectable],
  );

  const nodeType = type ?? "default";
  const NodeComponent = nodeTypes[nodeType] ?? nodeTypes.default ?? DefaultNode;
  const renderedNodeType = nodeTypes[nodeType] ? nodeType : "default";
  const nodeProps: NodeComponentProps = {
    id,
    type,
    data,
    selectable,
    selected: isSelected,
    isSelected,
    position,
    draggable,
    dragging: nodeDrag.dragging,
  };
  const className = [
    "dag-flow__node",
    `dag-flow__node-${renderedNodeType}`,
    selectable ? "selectable" : "",
    draggable ? "draggable" : "",
    nodeDrag.dragging ? "dragging" : "",
    isSelected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const targetPosition = direction === "horizontal" ? Position.Left : Position.Top;
  const sourcePosition = direction === "horizontal" ? Position.Right : Position.Bottom;

  return (
    <div
      {...rest}
      ref={ref}
      className={className}
      data-id={id}
      data-node-id={id}
      data-node-type={renderedNodeType}
      data-nopan
      tabIndex={selectable ? 0 : undefined}
      role={selectable ? "group" : undefined}
      aria-label={node.ariaLabel}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (!selectable) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          dispatch({ type: "UPDATE_SELECTED_NODE", payload: { id } });
        } else if (event.key === "Escape") {
          dispatch({ type: "CLEAR_SELECTION" });
        }
      }}
      onPointerDown={nodeDrag.onPointerDown}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        visibility: measured ? "visible" : "hidden",
      }}
    >
      <NodeIdContext.Provider value={id}>
        <Handle type="target" position={targetPosition} />
        <NodeComponent {...nodeProps} />
        <Handle type="source" position={sourcePosition} />
      </NodeIdContext.Provider>
    </div>
  );
}

export default memo(NodeWrapper);
