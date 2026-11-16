import type { EdgeSpec, FlowModel, FlowPath } from "../types/index.ts";
import Flow from "./Flow.ts";

/** 逻辑边 id；边状态 map 以此为键 */
export function getEdgeId(source: string, target: string): string {
  return `${source}->${target}`;
}

/**
 * 从 flow 拓扑计算全部连线（无重复、无交叉语义，仅相邻关系）：
 * - 串行步骤：上一步末端节点 → 当前节点
 * - 并行组：上一步末端节点 → 每条路径首节点；组内路径按顺序串联；组末端为各路径末节点
 * 使用标准化 flow，保证边 id 与渲染路径一致。
 */
export function computeDagEdges(flow: FlowModel): EdgeSpec[] {
  const edges: EdgeSpec[] = [];
  let prevTails: string[] = [];

  new Flow(flow).toArray().forEach((step) => {
    if (typeof step === "string") {
      for (const tail of prevTails)
        edges.push({ id: getEdgeId(tail, step), source: tail, target: step });
      prevTails = [step];
      return;
    }

    const heads: string[] = [];
    const tails: string[] = [];
    for (const path of step as FlowPath[]) {
      if (path.length === 0) continue;
      for (let i = 1; i < path.length; i++) {
        edges.push({
          id: getEdgeId(path[i - 1], path[i]),
          source: path[i - 1],
          target: path[i],
        });
      }
      heads.push(path[0]);
      tails.push(path[path.length - 1]);
    }
    for (const tail of prevTails) {
      for (const head of heads)
        edges.push({ id: getEdgeId(tail, head), source: tail, target: head });
    }
    prevTails = tails;
  });

  return edges;
}
