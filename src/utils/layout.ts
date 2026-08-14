import type { FlowModel, LayoutEngine, XYPosition } from "../types/index.ts";
import type { FlowPath } from "../types/index.ts";
import Flow from "./Flow.ts";

export interface LayoutOptions {
  /** 单个水平连线段长度；并行边界会按拓扑占用多个段 */
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
 * - hGap 表示一个可见连线段：并行组入口、出口各占一段
 * - 连续并行组之间额外保留一段主干，因此节点间共三个 hGap
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

  let previousExitX: number | null = null;
  let centerY = 0;

  for (const step of normalized) {
    const isParallel = typeof step !== "string";
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

    // 并行组节点前预留分叉段；前一步的 exit 已包含其汇合段。
    const defaultStepX =
      previousExitX === null
        ? isParallel
          ? hGap
          : 0
        : previousExitX + (isParallel ? 2 * hGap : hGap);

    // 列 x：若存在 pinned 节点则以 pinned 的 x 为列锚，否则按拓扑段递进
    const pinnedMaxRight = pinnedInStep.reduce(
      (acc, id) => Math.max(acc, pinned.get(id)!.x + dim(id).width),
      -Infinity,
    );
    const stepX = pinnedInStep.length > 0 ? pinned.get(pinnedInStep[0])!.x : defaultStepX;
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

    // 并行组出口为最长路径右侧的汇合总线，短路径由边网络延伸至此。
    const rightEdge = Math.max(pinnedMaxRight, stepX + rowWidth);
    previousExitX = rightEdge + (isParallel ? hGap : 0);
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

/** 创建默认列式 DAG 布局引擎，算法配置由闭包持有 */
export function createDefaultLayoutEngine(options: LayoutOptions = {}): LayoutEngine {
  return ({ flow, dimensions }) => ({
    positions: computeLayout(flow, dimensions, new Map(), options),
  });
}

export const defaultLayoutEngine = createDefaultLayoutEngine();
