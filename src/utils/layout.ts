import type { FlowDirection, FlowModel, LayoutEngine, XYPosition } from "../types/index.ts";
import type { FlowPath } from "../types/index.ts";
import Flow from "./Flow.ts";

export interface DefaultLayoutOptions {
  /** 单个主轴连线段长度；并行边界会按拓扑占用多个段 */
  hGap?: number;
  /** 并行路径在交叉轴上的间距 */
  vGap?: number;
  /** 主轴方向，horizontal 从左到右，vertical 从上到下 */
  direction?: FlowDirection;
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
 * - hGap 表示主轴上的一个可见连线段：并行组入口、出口各占一段
 * - 连续并行组之间额外保留一段主干，因此节点间共三个 hGap
 * - horizontal 时路径从左到右、分支上下堆叠；vertical 时路径从上到下、分支左右堆叠
 * - 主干的交叉轴坐标固定为 0，分支增删只会向主干两侧扩展
 * - pinned（已拖动/用户给 position）节点焊死：不输出、不参与计算，
 *   但占用所在步骤的主轴范围，且其中心定义主干的交叉轴锚点
 */
export function computeLayout(
  flow: FlowModel,
  dims: Map<string, Dim>,
  pinned: Map<string, XYPosition>,
  opts: DefaultLayoutOptions,
): Map<string, XYPosition> {
  const {
    hGap = 160,
    vGap = 16,
    direction = "horizontal",
    defaultNodeWidth = 150,
    defaultNodeHeight = 40,
  } = opts;
  const normalized = new Flow(Array.isArray(flow) ? flow : []).toArray();

  const result = new Map<string, XYPosition>();
  const dim = (id: string): Dim =>
    dims.get(id) ?? { width: defaultNodeWidth, height: defaultNodeHeight };

  const mainSize = (size: Dim) => (direction === "horizontal" ? size.width : size.height);
  const crossSize = (size: Dim) => (direction === "horizontal" ? size.height : size.width);
  const mainPosition = (position: XYPosition) =>
    direction === "horizontal" ? position.x : position.y;
  const crossPosition = (position: XYPosition) =>
    direction === "horizontal" ? position.y : position.x;
  const position = (main: number, cross: number): XYPosition =>
    direction === "horizontal" ? { x: main, y: cross } : { x: cross, y: main };

  let previousExit: number | null = null;
  let centerCross = 0;

  for (const step of normalized) {
    const isParallel = typeof step !== "string";
    const paths: FlowPath[] = typeof step === "string" ? [[step]] : step;

    const pinnedInStep = paths.flat().filter((id) => pinned.has(id));

    // 有 pinned 时由 pinned 中心定义主干；否则固定为 0，不随分支数量变化。
    if (pinnedInStep.length > 0) {
      const pinsCenter = pinnedInStep.reduce(
        (sum, id) => sum + crossPosition(pinned.get(id)!) + crossSize(dim(id)) / 2,
        0,
      );
      centerCross = pinsCenter / pinnedInStep.length;
    }

    // 每条并行路径沿主轴串联，路径间沿交叉轴堆叠。
    const rowGeom = paths.map((path) => {
      let mainLength = 0;
      let maxCrossSize = 0;
      for (const id of path) {
        const d = dim(id);
        mainLength += mainSize(d) + (mainLength === 0 ? 0 : hGap);
        maxCrossSize = Math.max(maxCrossSize, crossSize(d));
      }
      return { path, mainLength, crossSize: maxCrossSize };
    });

    // 并行组节点前预留分叉段；前一步的 exit 已包含其汇合段。
    const defaultStepMain =
      previousExit === null
        ? isParallel
          ? hGap
          : 0
        : previousExit + (isParallel ? 2 * hGap : hGap);

    // 若存在 pinned 节点则以其主轴坐标为步骤锚，否则按拓扑段递进。
    const pinnedMaxEnd = pinnedInStep.reduce(
      (acc, id) => Math.max(acc, mainPosition(pinned.get(id)!) + mainSize(dim(id))),
      -Infinity,
    );
    const stepMain =
      pinnedInStep.length > 0 ? mainPosition(pinned.get(pinnedInStep[0])!) : defaultStepMain;
    const stepMainLength = rowGeom.reduce((acc, row) => Math.max(acc, row.mainLength), 0);

    const groupCrossSize =
      rowGeom.reduce((acc, row) => acc + row.crossSize, 0) + (paths.length - 1) * vGap;
    const groupCrossStart = centerCross - groupCrossSize / 2;

    let rowCross = groupCrossStart;
    for (const row of rowGeom) {
      let nodeMain = stepMain;
      for (const id of row.path) {
        const d = dim(id);
        if (!pinned.has(id)) {
          result.set(id, position(nodeMain, rowCross + (row.crossSize - crossSize(d)) / 2));
        }
        nodeMain += mainSize(d) + hGap;
      }
      if (row.path.length > 0) {
        rowCross += row.crossSize + vGap;
      }
    }

    // 并行组出口为最长路径右侧的汇合总线，短路径由边网络延伸至此。
    const stepEnd = Math.max(pinnedMaxEnd, stepMain + stepMainLength);
    previousExit = stepEnd + (isParallel ? hGap : 0);
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
export function createDefaultLayoutEngine(options: DefaultLayoutOptions = {}): LayoutEngine {
  return ({ flow, dimensions }) => ({
    positions: computeLayout(flow, dimensions, new Map(), options),
  });
}

export const defaultLayoutEngine = createDefaultLayoutEngine();
