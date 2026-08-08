import type { EdgeSpec, FlowModel, FlowPath } from "../types/index.ts";

/**
 * 从 flow 拓扑计算全部连线（无重复、无交叉语义，仅相邻关系）：
 * - 串行步骤：上一步末端节点 → 当前节点
 * - 并行组：上一步末端节点 → 每条路径首节点；组内路径按顺序串联；组末端为各路径末节点
 */
export function computeDagEdges(flow: FlowModel): EdgeSpec[] {
  const edges: EdgeSpec[] = [];
  let prevTails: string[] = [];

  flow.forEach((step) => {
    if (typeof step === "string") {
      for (const tail of prevTails)
        edges.push({ id: `${tail}->${step}`, source: tail, target: step });
      prevTails = [step];
      return;
    }

    const heads: string[] = [];
    const tails: string[] = [];
    for (const path of step as FlowPath[]) {
      if (path.length === 0) continue;
      for (let i = 1; i < path.length; i++) {
        edges.push({ id: `${path[i - 1]}->${path[i]}`, source: path[i - 1], target: path[i] });
      }
      heads.push(path[0]);
      tails.push(path[path.length - 1]);
    }
    for (const tail of prevTails) {
      for (const head of heads) edges.push({ id: `${tail}->${head}`, source: tail, target: head });
    }
    prevTails = tails;
  });

  return edges;
}
