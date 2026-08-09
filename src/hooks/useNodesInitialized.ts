import useCanvasState from "./useCanvasState.ts";

/** 当前所有节点是否已完成尺寸测量；空图返回 false。 */
export default function useNodesInitialized(): boolean {
  const { nodeMap, nodeDimensions } = useCanvasState();
  if (!nodeMap || nodeMap.size === 0) return false;
  for (const id of nodeMap.keys()) {
    if (!nodeDimensions?.has(id)) return false;
  }
  return true;
}
