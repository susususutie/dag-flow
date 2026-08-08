import { memo } from "react";
import type { NodeComponentProps } from "../../types/index.ts";

/** 通用节点组件；复杂节点通过 nodeTypes 注册表提供 */
function DefaultNode(props: NodeComponentProps) {
  const { id, data, selectable, selected } = props;

  const className = ["dag-flow-node"]
    .concat(selectable ? ["dag-flow-node--selectable"] : [])
    .concat(selected ? ["dag-flow-node--selected"] : [])
    .join(" ");

  return (
    <div className={className}>
      {data && "label" in data ? String((data as { label?: unknown }).label) : id}
    </div>
  );
}

export default memo(DefaultNode);
