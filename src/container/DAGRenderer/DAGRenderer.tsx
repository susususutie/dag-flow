import { forwardRef } from "react";
import DAGCanvas from "../DAGCanvas/DAGCanvas.tsx";
import DAGProvider from "../../components/DAGProvider/DAGProvider.tsx";
import type { DAGCanvasProps } from "../DAGCanvas/DAGCanvas.tsx";
import type { GraphViewHandle } from "../GraphView/GraphView.tsx";

/**
 * 数据驱动的独立 DAG 渲染器。
 * 始终创建自己的 store，不受外层 DAGProvider 影响；其余参数与 DAGCanvas 一致。
 */
const DAGRenderer = forwardRef<GraphViewHandle, DAGCanvasProps>(function DAGRenderer(props, ref) {
  return (
    <DAGProvider>
      <DAGCanvas ref={ref} {...props} />
    </DAGProvider>
  );
});

export default DAGRenderer;
