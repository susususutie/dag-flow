import CanvasProvider from "../../store/CanvasProvider.tsx";
import type { ReactNode } from "react";

/**
 * 为 DagFlow 外部的 hooks 提供同一份画布状态；nodes 和 flow 由 DagFlow 负责同步。
 * @example
 * ```tsx
 * import { DagFlowProvider, DagFlow, useNodes } from "dag-flow";
 *
 * export default function Flow() {
 *   return (
 *     <DagFlowProvider>
 *       <DagFlow nodes={...} flow={...} />
 *       <NodeCounter />
 *     </DagFlowProvider>
 *   );
 * }
 *
 * function NodeCounter() {
 *   // 部分 hook 仅在 DagFlowProvider 内部使用，用于获取画布内部状态
 *   const nodes = useNodes();
 *
 *   return (
 *     <div>共{nodes.length}个节点</div>
 *   );
 * }
 * ```
 */
export default function DagFlowProvider({ children }: { children?: ReactNode }) {
  return <CanvasProvider>{children}</CanvasProvider>;
}
