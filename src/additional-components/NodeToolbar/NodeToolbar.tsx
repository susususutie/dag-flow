import { useMemo } from "react";
import OverlayPortal from "../../components/OverlayPortal/index.tsx";
import { useNodeId } from "../../contexts/NodeIdContext.tsx";
import useCanvasState from "../../hooks/useCanvasState.ts";
import useCanvasTransform from "../../hooks/useCanvasTransform.ts";
import { Position } from "../../types/index.ts";
import getNodeToolbarTransform from "./getNodeToolbarTransform.ts";
import type { HTMLAttributes } from "react";
import type { ToolbarAlign, ToolbarPosition } from "./getNodeToolbarTransform.ts";

export interface NodeToolbarProps extends HTMLAttributes<HTMLDivElement> {
  nodeId?: string | string[];
  isVisible?: boolean;
  position?: ToolbarPosition;
  offset?: number;
  align?: ToolbarAlign;
}

export default function NodeToolbar(props: NodeToolbarProps) {
  const {
    nodeId,
    isVisible,
    position = Position.Top,
    offset = 10,
    align = "center",
    className,
    style,
    children,
    ...rest
  } = props;
  const contextNodeId = useNodeId();
  const { nodeMap, nodeDimensions, selectedNodes } = useCanvasState();
  const viewport = useCanvasTransform();
  const ids = useMemo(() => {
    const value = nodeId ?? contextNodeId;
    return value == null ? [] : Array.isArray(value) ? value : [value];
  }, [contextNodeId, nodeId]);
  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const id of ids) {
      const node = nodeMap.get(id);
      const dimensions = nodeDimensions.get(id);
      if (!node?.position || !dimensions) continue;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + dimensions.width);
      maxY = Math.max(maxY, node.position.y + dimensions.height);
    }
    return minX === Infinity ? null : { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [ids, nodeDimensions, nodeMap]);
  const visible =
    isVisible ?? (ids.length === 1 && selectedNodes.size === 1 && selectedNodes.has(ids[0]));
  if (!visible || !bounds) return null;

  return (
    <OverlayPortal>
      <div
        {...rest}
        className={["dag-flow__node-toolbar", className].filter(Boolean).join(" ")}
        style={{
          ...style,
          transform: getNodeToolbarTransform(bounds, viewport, position, offset, align),
        }}
      >
        {children}
      </div>
    </OverlayPortal>
  );
}
