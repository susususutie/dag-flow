import type { DAGNode } from "../types/index.ts";
import type { NodeChanges } from "../types/index.ts";

/**
 * 应用节点变更数组到节点列表（对齐 React Flow applyNodeChanges）。
 * 镜像模式场景：引擎内部操作后发出 changes，业务 apply 保持节点副本同步。
 * @param changes 节点变更数组
 * @param nodes 当前节点列表
 * @returns 应用变更后的新节点数组
 */
export default function applyNodeChanges(changes: NodeChanges, nodes: DAGNode[]): DAGNode[] {
  return changes.reduce<DAGNode[]>((nextNodes, change) => {
    switch (change.type) {
      case "add": {
        const addIndex = change.index ?? nextNodes.length;
        return [...nextNodes.slice(0, addIndex), change.item, ...nextNodes.slice(addIndex)];
      }
      case "remove": {
        return nextNodes.filter((node) => node.id !== change.id);
      }
      case "select": {
        return nextNodes.map((node) =>
          node.id === change.id ? { ...node, selected: change.selected } : node,
        );
      }
      case "replace": {
        return nextNodes.map((node) => (node.id === change.id ? change.item : node));
      }
      default: {
        // position/dimensions 等不改变业务数据，镜像模式不处理
        return nextNodes;
      }
    }
  }, nodes);
}
