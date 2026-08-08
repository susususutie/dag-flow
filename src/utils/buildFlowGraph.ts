import Flow from "./Flow.ts";
import { computeLayout, getNodesBounds, type LayoutOptions } from "./layout.ts";
import type { FlowModel, XYPosition, NodeMeasure } from "../types/index.ts";

export interface BuildFlowGraphOptions extends LayoutOptions {
  /** 已测量节点尺寸（未测量节点使用 defaultNodeWidth/Height） */
  dimensions?: Map<string, NodeMeasure>;
  /** 用户手动固定位置的节点（焊死不参与布局，后续列自动避让） */
  pinned?: Map<string, XYPosition>;
  /** 拖拽中的临时位置（优先级最高） */
  dragged?: Map<string, XYPosition>;
}

export interface PreparedFlowGraph {
  positions: Map<string, XYPosition>;
  bounds: { x: number; y: number; width: number; height: number } | null;
}

/**
 * 由 flow 拓扑准备渲染图：计算自动布局坐标 + 整体边界。
 * 位置优先级：dragged（拖拽中） > pinned（用户固定） > 自动布局。
 */
export function prepareFlow(
  flow: FlowModel,
  options: BuildFlowGraphOptions = {},
): PreparedFlowGraph {
  const { dimensions, pinned, dragged, ...layoutOptions } = options;
  const normalized = new Flow(flow).toArray();
  const positions = computeLayout(
    normalized,
    dimensions ?? new Map(),
    pinned ?? new Map(),
    layoutOptions,
  );

  const dims = new Map<string, { width: number; height: number }>();
  dimensions?.forEach((measure, id) =>
    dims.set(id, { width: measure.width, height: measure.height }),
  );

  const resolved = new Map<string, XYPosition>();
  for (const id of new Flow(normalized).getNodeIds()) {
    resolved.set(id, dragged?.get(id) ?? pinned?.get(id) ?? positions.get(id) ?? { x: 0, y: 0 });
  }
  return {
    positions: resolved,
    bounds: getNodesBounds(
      resolved,
      dims,
      layoutOptions.defaultNodeWidth,
      layoutOptions.defaultNodeHeight,
    ),
  };
}
