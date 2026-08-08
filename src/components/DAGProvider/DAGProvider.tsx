import CanvasProvider from "../../store/CanvasProvider.tsx";
import type { ReactNode } from "react";

/**
 * 为 DAGCanvas 外部的 hooks 提供同一份画布状态；nodes / flow 由 DAGCanvas 负责同步。
 */
export default function DAGProvider({ children }: { children?: ReactNode }) {
  return <CanvasProvider>{children}</CanvasProvider>;
}
