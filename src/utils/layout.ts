import type { FlowModel, XYPosition } from "../types/index.ts";
import type { FlowPath } from "../types/index.ts";
import type { LayoutEngine } from "../types/index.ts";
import Flow from "./Flow.ts";

export interface LayoutOptions {
  /** 相邻节点水平间距（同 hGap） */
  hGap?: number;
  /** 并行路径垂直间距（同 vGap） */
  vGap?: number;
  /** 未测量节点默认宽度 */
  defaultNodeWidth?: number;
  /** 未测量节点默认高度 */
  defaultNodeHeight?: number;
}

interface Dim {
  width: number;
  height: number;
}

/**
 * 自动布局引擎：将 flow 拓扑换算为节点坐标（仅输出未拖动节点）。
 *
 * 布局语义（与既有可视化一致）：
 * - 顶层步骤按列递进（相邻列 x = 前列最右 + hGap）
 * - 串行步骤单行；并行组路径垂直堆叠（组内 path 横向串联）
 * - 每列垂直聚中（centerY 沿链传递），并行组整体居中于前列中心
 * - pinned（已拖动/用户给 position）节点焊死：不输出、不参与计算，
 *   但占用所在列的宽度与 x 锚（后续列自动避让）
 */
export function computeLayout(
  flow: FlowModel,
  dims: Map<string, Dim>,
  pinned: Map<string, XYPosition>,
  opts: LayoutOptions,
): Map<string, XYPosition> {
  const { hGap = 160, vGap = 16, defaultNodeWidth = 150, defaultNodeHeight = 40 } = opts;
  const normalized = new Flow(Array.isArray(flow) ? flow : []).toArray();

  const result = new Map<string, XYPosition>();
  const dim = (id: string): Dim =>
    dims.get(id) ?? { width: defaultNodeWidth, height: defaultNodeHeight };

  let colX = 0;
  let centerY = 0;

  for (const step of normalized) {
    const paths: FlowPath[] = typeof step === "string" ? [[step]] : step;

    const pinnedInStep = paths.flat().filter((id) => pinned.has(id));

    // 列中心沿链传递：有 pinned 时跟随 pinned 中心（本列即生效）
    if (pinnedInStep.length > 0) {
      const pinsCenter = pinnedInStep.reduce(
        (sum, id) => sum + pinned.get(id)!.y + dim(id).height / 2,
        0,
      );
      centerY = pinsCenter / pinnedInStep.length;
    }

    // 行几何：每条路径一行（横向串联），行宽 = 路径内节点宽和 + hGap
    const rowGeom = paths.map((path) => {
      let width = 0;
      let maxHeight = 0;
      for (const id of path) {
        const d = dim(id);
        width += d.width + (width === 0 ? 0 : hGap);
        maxHeight = Math.max(maxHeight, d.height);
      }
      return { path, width, height: maxHeight };
    });

    // 列 x：若存在 pinned 节点则以 pinned 的 x 为列锚，否则接在前列最右
    const pinnedMaxRight = pinnedInStep.reduce(
      (acc, id) => Math.max(acc, pinned.get(id)!.x + dim(id).width),
      colX,
    );
    const stepX = pinnedInStep.length > 0 ? pinned.get(pinnedInStep[0])!.x : colX;
    const rowWidth = rowGeom.reduce((acc, row) => Math.max(acc, row.width), 0);

    // 列高（并行组垂直堆叠）
    const groupHeight =
      rowGeom.reduce((acc, row) => acc + row.height, 0) + (paths.length - 1) * vGap;
    const groupTop = centerY - groupHeight / 2;

    let rowY = groupTop;
    for (const row of rowGeom) {
      // 行内节点横向串联
      let nodeX = stepX;
      for (const id of row.path) {
        const d = dim(id);
        if (!pinned.has(id)) {
          result.set(id, { x: nodeX, y: rowY + (row.height - d.height) / 2 });
        }
        nodeX += d.width + hGap;
      }
      if (row.path.length > 0) {
        rowY += row.height + vGap;
      }
    }

    // 下一列锚点
    const rightEdge = Math.max(pinnedMaxRight, stepX + rowWidth);
    colX = rightEdge + hGap;
  }

  return result;
}

/** 节点边界：position + 尺寸合并（对齐 React Flow getNodesBounds） */
export function getNodesBounds(
  positions: Map<string, XYPosition>,
  dims: Map<string, Dim>,
  defaultNodeWidth = 150,
  defaultNodeHeight = 40,
): { x: number; y: number; width: number; height: number } | null {
  if (positions.size === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [id, pos] of positions) {
    const d = dims.get(id) ?? { width: defaultNodeWidth, height: defaultNodeHeight };
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + d.width);
    maxY = Math.max(maxY, pos.y + d.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** 默认布局引擎：列式 DAG 路由（消费 config.hGap/vGap，未测量节点按 150×40 计算） */
export const defaultLayoutEngine: LayoutEngine = (flow, { dimensions, pinned, config }) =>
  computeLayout(flow, dimensions, pinned, { hGap: config.hGap, vGap: config.vGap });
