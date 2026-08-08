import { useMemo } from "react";
import type { EdgeSpec, XYPosition } from "../../types/index.ts";
import type { EdgeProps } from "../../types/index.ts";
import { Position } from "../../types/index.ts";
import SmoothStepEdge from "../Edges/SmoothStepEdge.tsx";
import { getSmoothStepPath } from "../../utils/edges/paths.ts";

interface EdgeLayerProps {
  edges: EdgeSpec[];
  /** 节点渲染位置（布局/拖动/固定合成后的最终坐标） */
  positions: Map<string, XYPosition>;
  /** 节点尺寸（未测量时回退默认 150×40） */
  dimensions: Map<string, { width: number; height: number }>;
  /** 连接手柄拖拽中的临时边（source 节点 + 鼠标画布坐标），null 表示无拖拽 */
  connectingEdge?: { source: string; position: XYPosition } | null;
}

const DEFAULT_DIM = { width: 150, height: 40 };

/**
 * 连线层：坐标驱动渲染（对应 React Flow edges 层）。
 * 锚点取源节点右边界中点（Right）与目标节点左边界中点（Left），统一使用内置平滑直角边。
 */
export default function EdgeLayer(props: EdgeLayerProps) {
  const { edges, positions, dimensions, connectingEdge } = props;

  const edgeComponents = useMemo(() => {
    const result: Array<{ edge: EdgeSpec; component: React.ComponentType<EdgeProps> }> = [];
    for (const edge of edges) {
      const sourcePos = positions.get(edge.source);
      const targetPos = positions.get(edge.target);
      if (!sourcePos || !targetPos) continue;
      result.push({ edge, component: SmoothStepEdge });
    }
    return result;
  }, [edges, positions]);

  const connectPath = useMemo<string | null>(() => {
    if (!connectingEdge) return null;
    const source = positions.get(connectingEdge.source);
    if (!source) return null;
    const dim = dimensions.get(connectingEdge.source) ?? DEFAULT_DIM;
    const sourceX = source.x + dim.width;
    const sourceY = source.y + dim.height / 2;
    const targetX = connectingEdge.position.x;
    const targetY = connectingEdge.position.y;
    const [d] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition: Position.Right,
      targetX,
      targetY,
      targetPosition: Position.Left,
    });
    return d;
  }, [connectingEdge, positions, dimensions]);

  const hasEdges = edgeComponents.length > 0 || connectPath !== null;
  if (!hasEdges) return null;

  return (
    <div className="dag-flow__edges" aria-hidden="true">
      <svg>
        {edgeComponents.map(({ edge, component: EdgeComponent }) => {
          const sourcePos = positions.get(edge.source)!;
          const targetPos = positions.get(edge.target)!;
          const sourceDim = dimensions.get(edge.source) ?? DEFAULT_DIM;
          const targetDim = dimensions.get(edge.target) ?? DEFAULT_DIM;
          const edgeProps: EdgeProps = {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceX: sourcePos.x + sourceDim.width,
            sourceY: sourcePos.y + sourceDim.height / 2,
            targetX: targetPos.x,
            targetY: targetPos.y + targetDim.height / 2,
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            selected: edge.selected,
            data: edge.data,
          };
          return <EdgeComponent key={edge.id} {...edgeProps} />;
        })}
        {connectPath && (
          <path
            className="dag-flow__edge-path dag-flow__edge-path--connecting"
            d={connectPath}
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}
