import { memo, useMemo } from "react";
import NodeWrapper from "../../components/NodeWrapper/index.tsx";
import useFlow from "../../hooks/useFlow.ts";
import useResizeObserver from "./useResizeObserver.ts";

function NodeRenderer() {
  const flow = useFlow();
  const resizeObserver = useResizeObserver();
  const nodeIds = useMemo(() => {
    const ids: string[] = [];
    for (const step of flow) {
      if (typeof step === "string") ids.push(step);
      else for (const path of step) ids.push(...path);
    }
    return ids;
  }, [flow]);

  return (
    <div className="dag-flow__nodes">
      {nodeIds.map((id) => (
        <NodeWrapper key={id} id={id} resizeObserver={resizeObserver} />
      ))}
    </div>
  );
}

export default memo(NodeRenderer);
