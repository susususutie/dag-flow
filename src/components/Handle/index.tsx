import { memo } from "react";
import { useNodeId } from "../../contexts/NodeIdContext.tsx";
import { Position } from "../../types/index.ts";
import useConnectionDrag from "./useConnectionDrag.ts";

interface HandleProps {
  type: "source" | "target";
  position: Position.Left | Position.Right | Position.Top | Position.Bottom;
}

/** 画布内部统一连接点；当前不作为自定义节点的公开 API。 */
function Handle({ type, position }: HandleProps) {
  const nodeId = useNodeId();
  const startConnection = useConnectionDrag(type === "source" ? nodeId : null);

  return (
    <span
      className={`dag-flow__handle dag-flow__handle-${position} ${type}`}
      data-handle={type}
      data-nodrag
      onPointerDown={type === "source" ? startConnection : undefined}
    />
  );
}

export default memo(Handle);
