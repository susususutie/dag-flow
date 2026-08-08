import Flow from "./Flow.ts";
import { computeDagEdges } from "./edges.ts";
import type { FlowModel } from "../types/index.ts";

/**
 * 重连节点：将 nodeId 从其当前位置移除，挂到 afterId 之后（新边 afterId → nodeId）。
 * - afterId 为串行步骤 → nodeId 作为其后的串行步骤
 * - afterId 位于并行组 → nodeId 追加到该路径末尾（保持并行结构）
 * - nodeId 原路径变空时自动收缩（路径移除 / 并行组折叠）
 * 自连或会形成环（afterId 是 nodeId 的后代）时返回 null。
 */
export function reconnectNode(flow: FlowModel, nodeId: string, afterId: string): FlowModel | null {
  if (nodeId === afterId) return null;

  const flowInstance = new Flow(flow);
  if (!flowInstance.hasNode(nodeId) || !flowInstance.hasNode(afterId)) return null;

  // 防环：若 afterId 已是 nodeId 的后代（存在 nodeId → … → afterId 路径），重连将成环
  const edges = computeDagEdges(flowInstance.toArray());
  const successors = new Map<string, string[]>();
  for (const edge of edges) {
    const list = successors.get(edge.source) ?? [];
    list.push(edge.target);
    successors.set(edge.source, list);
  }
  const queue = [nodeId];
  const visited = new Set<string>([nodeId]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === afterId) return null;
    for (const next of successors.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  const nodePos = flowInstance.findNode(nodeId);
  if (!nodePos) return null;

  // 1) 从原位置移除 nodeId
  if (nodePos.type === "serial") {
    flowInstance.data.splice(nodePos.topIndex, 1);
  } else {
    const group = flowInstance.data[nodePos.topIndex] as string[][];
    const path = group[nodePos.pathIndex!];
    path.splice(nodePos.nodeIndexInPath!, 1);
    if (path.length === 0) {
      group.splice(nodePos.pathIndex!, 1);
      if (group.length === 1) {
        flowInstance.data.splice(nodePos.topIndex, 1, ...group[0]);
      } else if (group.length === 0) {
        flowInstance.data.splice(nodePos.topIndex, 1);
      }
    }
  }

  // 2) 移除后重新定位 afterId（索引已漂移，需重新查找）
  const afterPos = flowInstance.findNode(afterId);
  if (!afterPos) return flowInstance.toArray();

  // 3) 插入 nodeId 到 afterId 之后
  if (afterPos.type === "serial") {
    flowInstance.data.splice(afterPos.topIndex + 1, 0, nodeId);
  } else {
    const group = flowInstance.data[afterPos.topIndex] as string[][];
    group[afterPos.pathIndex!].push(nodeId);
  }

  return flowInstance.toArray();
}
