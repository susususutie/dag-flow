import { forwardRef, useId } from "react";
import type { CSSProperties, ReactNode } from "react";
import StoreUpdater from "../../components/StoreUpdater/StoreUpdater.tsx";
import Wrapper from "./Wrapper.tsx";
import GraphView from "../GraphView/GraphView.tsx";
import type { GraphViewHandle } from "../GraphView/GraphView.tsx";
import type { CanvasProviderProps } from "../../types/index.ts";
import { palette } from "../../utils/color.ts";

export interface DAGCanvasProps extends CanvasProviderProps {
  id?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * @param {Object} props
 * @param {string} [props.id] - DAGCanvas 根元素 id（缺省时自动生成）
 * @param {string} props.style - 根元素样式
 * @param {Array} [props.flow] - 受控拓扑结构（引擎模型：串行节点 id 或并行组数组）
 * @param {Array} [props.defaultFlow] - 非受控模式的初始拓扑结构，仅首次挂载时生效
 * @param {Array<{id: string, type?: string, data: Object, selectable?: boolean}>} [props.nodes] - 受控节点数据（React Flow nodes），作为节点数据源
 * @param {Array} [props.defaultNodes] - 非受控模式的初始节点数据，仅首次挂载时生效
 * @param {{x: number, y: number, zoom: number}} [props.defaultViewport = {x: 0, y: 0, zoom: 1}] - 初始视口（React Flow defaultViewport）；zoom 受全局 minZoom/maxZoom 限制
 * @param {number} [props.hGap = 160] - 节点水平间距（相邻节点间总间距）
 * @param {number} [props.vGap = 16] - 节点垂直间距
 * @param {number} [props.lineWidth = 2] - 边线宽度
 * @param {string} [props.lineColor = 'default'] - 边线颜色，支持状态色关键词或任意 CSS 颜色
 * @param {boolean} [props.nodesSelectable = true] - 节点是否可选中，可由 node.selectable 覆盖
 * @param {number} [props.minZoom = 0.5] - 最小缩放比例
 * @param {number} [props.maxZoom = 2] - 最大缩放比例
 * @param {boolean} [props.fitView = false] - 是否初始缩放并居中适应画布内容（React Flow fitView）
 * @param {Object} [props.fitViewOptions] - 初始 fitView 调用参数；未提供的 padding/horizontalAlign/verticalAlign 使用默认配置
 * @param {boolean} [props.zoomOnScroll = true] - 是否在滚动时缩放（zoomModifier 可限制触发按键）
 * @param {'none' | 'ctrl' | 'meta'} [props.zoomModifier = 'none'] - 缩放修饰键
 * @param {boolean} [props.panOnScroll = false] - 是否在滚动时平移（与 zoomOnScroll 互斥）
 * @param {'none' | 'ctrl' | 'meta'} [props.panScrollModifier = 'none'] - 平移滚动修饰键
 * @param {boolean} [props.panOnDrag = true] - 是否在左键按住拖拽时平移
 * @param {'none' | 'meta'} [props.panDragModifier = 'none'] - 平移拖拽修饰键
 * @param {(changes: Array) => void} [props.onNodesChange] - 节点变更通知（React Flow onNodesChange），业务可用 applyNodeChanges 同步节点
 * @param {(flow: Array, meta: {reason: 'insert' | 'remove' | 'update'}) => void} [props.onFlowChange] - 拓扑变更通知，flow 为标准化后的完整结构
 * @param {(event: MouseEvent, node: {id: string, data: Object}) => void} [props.onNodeClick] - 点击节点回调
 * @param {(params: {nodes: Array}) => boolean | {nodes: Array} | Promise} [props.onBeforeDelete] - 删除前回调；返回 false 取消，返回 nodes 扩展待删节点
 * @param {({nodes: Array}) => void} [props.onSelectionChange] - 选中节点变化回调
 * @param {(e: MouseEvent) => void} [props.onPaneClick] - 点击画布空白区域回调
 * @param {(event: MouseEvent | null, viewport: {x: number, y: number, zoom: number}) => void} [props.onMove] - 视口移动/缩放变化回调
 * @param {Object} [props.nodeTypes] - 节点渲染注册表 { [type]: Component }；自定义组件接收 id/type/data/selectable/selected，未注册的类型回退到内置 DefaultNode
 *
 * ref 实例方法（useDAGInstance()）：
 * - getFlow() / getNodes() / getNode(id)
 * - setDAG(value) / setNodes(value) / setFlow(value)（原子联动更新）
 * - updateNode(id, update) / updateNodeData(id, update)
 * - deleteNode(node) / deleteNodes(nodes)：执行 onBeforeDelete 后原子更新 nodes 与 flow
 * - selectNode(id) / clearSelection()
 * - getFlowElement() / fitView(options?) / zoomIn() / zoomOut() / zoomTo(zoom)
 * - setViewport(viewport) / getViewport()
 */
const DAGCanvas = forwardRef<GraphViewHandle, DAGCanvasProps>(function DAGCanvas(props, ref) {
  const {
    id,
    style,
    children,
    //
    nodeTypes,
    nodes,
    flow,
    onNodesChange,
    onFlowChange,
    defaultNodes,
    defaultFlow,
    //
    minZoom = 0.5,
    maxZoom = 2,
    defaultViewport,
    fitView = false,
    fitViewOptions,
    hGap = 160,
    vGap = 16,
    lineWidth = 2,
    lineColor = "default",
    // 交互
    onNodeClick,
    nodesSelectable = true,
    onSelectionChange,
    onBeforeDelete,
    zoomOnScroll = true,
    zoomModifier = "none",
    panOnScroll = false,
    panScrollModifier = "none",
    panOnDrag = true,
    panDragModifier = "none",
    onPaneClick,
    onMove,
    onLayoutChange,
    layoutEngine,
  } = props;

  const canvasId = useId();
  const uid = id || `DAG-${canvasId}`;

  const themeVariables = {
    "--dag-flow-primary": palette.colorPrimary,
    "--dag-flow-border": palette.colorBorder,
    "--dag-flow-bg": palette.colorBgContainer,
    "--dag-flow-text": "rgba(0, 0, 0, 0.88)",
    "--dag-flow-text-disabled": "rgba(0, 0, 0, 0.25)",
  } as CSSProperties;

  return (
    <div
      id={uid}
      className="dag-flow__canvas"
      style={{ ...themeVariables, ...style }}
      data-testid="dag-canvas"
    >
      <Wrapper
        uid={uid}
        defaultViewport={defaultViewport}
        flow={flow}
        defaultFlow={defaultFlow}
        nodes={nodes}
        defaultNodes={defaultNodes}
        minZoom={minZoom}
        maxZoom={maxZoom}
        fitView={fitView}
        fitViewOptions={fitViewOptions}
        hGap={hGap}
        vGap={vGap}
        lineWidth={lineWidth}
        lineColor={lineColor}
        nodesSelectable={nodesSelectable}
        zoomOnScroll={zoomOnScroll}
        zoomModifier={zoomModifier}
        panOnScroll={panOnScroll}
        panScrollModifier={panScrollModifier}
        panOnDrag={panOnDrag}
        panDragModifier={panDragModifier}
        nodeTypes={nodeTypes}
        layoutEngine={layoutEngine}
        onLayoutChange={onLayoutChange}
      >
        <StoreUpdater
          uid={uid}
          defaultViewport={defaultViewport}
          flow={flow}
          defaultFlow={defaultFlow}
          nodes={nodes}
          defaultNodes={defaultNodes}
          hGap={hGap}
          vGap={vGap}
          lineWidth={lineWidth}
          lineColor={lineColor}
          nodesSelectable={nodesSelectable}
          minZoom={minZoom}
          maxZoom={maxZoom}
          fitView={fitView}
          fitViewOptions={fitViewOptions}
          zoomOnScroll={zoomOnScroll}
          zoomModifier={zoomModifier}
          panOnScroll={panOnScroll}
          panScrollModifier={panScrollModifier}
          panOnDrag={panOnDrag}
          panDragModifier={panDragModifier}
          onNodesChange={onNodesChange}
          onFlowChange={onFlowChange}
          onNodeClick={onNodeClick}
          onBeforeDelete={onBeforeDelete}
          onSelectionChange={onSelectionChange}
          onPaneClick={onPaneClick}
          onMove={onMove}
          nodeTypes={nodeTypes}
          layoutEngine={layoutEngine}
          onLayoutChange={onLayoutChange}
        />
        <GraphView ref={ref}>{children}</GraphView>
      </Wrapper>
    </div>
  );
});

export default DAGCanvas;
