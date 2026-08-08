import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import useCanvasState from "../../hooks/useCanvasState.ts";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";
import computeFitView from "../../utils/geometry.ts";
import { resolveLineColor } from "../../utils/color.ts";
import { computeDagEdges } from "../../utils/edges.ts";
import { defaultLayoutEngine, getNodesBounds } from "../../utils/layout.ts";
import EdgeLayer from "./EdgeLayer.tsx";
import NodeWrapper from "../Nodes/NodeWrapper.tsx";
import type { DAGNode, FlowModel, FitViewOptions, XYPosition } from "../../types/index.ts";

/** 缩放步进因子（React Flow 默认 1.2） */
const ZOOM_FACTOR = 1.2;

export interface FlowHandle {
  getElement: () => HTMLElement | undefined;
  fitView: (options?: FitViewOptions) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (zoom: number) => void;
}

export interface FlowRendererProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;

  /** 流程图数据（缺省时从画布状态读取） */
  flow?: FlowModel;
  /** 节点数据映射（缺省时从画布状态读取） */
  nodeMap?: Map<string, DAGNode>;

  hGap?: number;
  vGap?: number;
  lineWidth?: number;
  lineColor?: string;
}

const FlowInternal = forwardRef<FlowHandle, FlowRendererProps>(function FlowInternal(props, ref) {
  const {
    className,
    style,
    flow: _flow,
    nodeMap: _nodeMap,
    hGap: _hGap,
    vGap: _vGap,
    lineWidth: _lineWidth,
    lineColor: _lineColor,
  } = props;
  const {
    uid,
    flow: _canvasFlow,
    layout,
    nodesSelectable,
    selectedNodes,
    nodeDimensions,
    nodeMap: _canvasNodeMap,
    computedPositions,
    dragPositions,
    connectingEdge,
    layoutEpoch,
    layoutEngine,
    minZoom,
    maxZoom,
    fitView,
    fitViewOptions,
  } = useCanvasState();
  const dispatch = useCanvasDispatch();
  const flow = _flow ?? _canvasFlow;
  const nodeMap = _nodeMap ?? _canvasNodeMap;

  // 渲染布局配置默认来源于全局 canvas state，可以通过 props 覆盖
  const originHGap = _hGap ?? layout?.hGap ?? 150;
  const originVGap = _vGap ?? layout?.vGap ?? 8;
  const originLineWidth = _lineWidth ?? layout?.lineWidth ?? 2;
  const originLineColor = _lineColor ?? layout?.lineColor ?? "default";
  const lineWidth = Math.min(Math.max(originLineWidth, 0), 10);
  const lineColor = resolveLineColor(originLineColor);
  const hGap = originHGap;
  const vGap = originVGap;
  const engine = layoutEngine ?? defaultLayoutEngine;
  const layoutConfig = useMemo(
    () => ({ hGap, vGap, lineWidth, lineColor }),
    [hGap, vGap, lineWidth, lineColor],
  );

  const flowDeps = computeFlowDepsStr(flow);
  // 依赖 flowDeps（flow 的 JSON 序列化）而非 flow 引用，序列化内容变化才重建渲染数据
  const renderFlow = useMemo<FlowModel>(() => {
    if (!Array.isArray(flow)) return [];
    try {
      return JSON.parse(flowDeps);
    } catch {
      return [];
    }
  }, [flowDeps]);

  // 连线数据：拓扑推导（EdgeSpec 带 id）
  const edges = useMemo(() => computeDagEdges(renderFlow), [renderFlow]);

  // 自动布局：flow 拓扑 + 已测量尺寸 → 未固定节点坐标
  // layoutEpoch 递增（layout() 强制重排）时忽略 pinned，全部重新计算
  const pinned = useMemo(() => {
    if (layoutEpoch > 0) return new Map<string, XYPosition>();
    const map = new Map<string, XYPosition>();
    _canvasNodeMap?.forEach((node) => {
      if (node.position) map.set(node.id, { x: node.position.x, y: node.position.y });
    });
    return map;
  }, [_canvasNodeMap, layoutEpoch]);
  const autoPositions = useMemo(
    () => engine(renderFlow, { dimensions: nodeDimensions, pinned, config: layoutConfig }),
    [renderFlow, nodeDimensions, pinned, engine, layoutConfig, layoutEpoch],
  );
  useEffect(() => {
    dispatch({ type: "SET_COMPUTED_POSITIONS", payload: autoPositions });
  }, [autoPositions, dispatch]);

  // 渲染节点列表：展平 flow 的全部节点
  const flatNodes = useMemo<string[]>(() => {
    const ids: string[] = [];
    for (const item of renderFlow) {
      if (typeof item === "string") ids.push(item);
      else for (const path of item) ids.push(...path);
    }
    return ids;
  }, [renderFlow]);

  // 最终渲染位置：拖拽中 > 固定 > 自动布局；与整体边界（fitView 依据）
  const effPositions = useMemo(() => {
    const map = new Map<string, XYPosition>();
    for (const id of flatNodes) {
      map.set(
        id,
        dragPositions?.get(id) ??
          nodeMap?.get(id)?.position ??
          computedPositions?.get(id) ?? { x: 0, y: 0 },
      );
    }
    return map;
  }, [flatNodes, dragPositions, nodeMap, computedPositions]);
  const bounds = useMemo(
    () => getNodesBounds(effPositions, nodeDimensions, 150, 40),
    [effPositions, nodeDimensions],
  );

  const flowRef = useRef<HTMLDivElement>(null);

  const doFitView = useCallback(
    (options?: FitViewOptions) => {
      if (!bounds || !flowRef.current) return;
      const container = document.getElementById(uid);
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const opts = options ?? {};
      const transform = computeFitView({
        containerWidth: rect.width,
        containerHeight: rect.height,
        contentWidth: bounds.width,
        contentHeight: bounds.height,
        padding: opts.padding ?? 0,
        minZoom: opts.minZoom ?? minZoom,
        maxZoom: opts.maxZoom ?? maxZoom,
        horizontalAlign: opts.horizontalAlign,
        verticalAlign: opts.verticalAlign,
      });
      dispatch({ type: "SET_TRANSFORM", payload: transform });
    },
    [dispatch, uid, bounds, minZoom, maxZoom],
  );

  // 初始 fitView：fitView 开启时仅在初始内容渲染完成后适应一次视口；
  // 数据变化后的适应由业务侧通过 ref.fitView() 主动触发（对齐 React Flow fitView 语义）
  const didInitialFitView = useRef(false);
  useLayoutEffect(() => {
    if (!fitView || didInitialFitView.current) return;
    didInitialFitView.current = true;
    doFitView(fitViewOptions);
  }, [fitView, fitViewOptions, doFitView]);

  // 围绕容器中心缩放（anchor 保持内容点不动）
  const zoomBy = useCallback(
    (factor: number) => {
      const container = document.getElementById(uid);
      if (!container) return;
      const rect = container.getBoundingClientRect();
      dispatch({
        type: "ZOOM_TO",
        payload: { factor, centerX: rect.width / 2, centerY: rect.height / 2 },
      });
    },
    [dispatch, uid],
  );
  const zoomTo = useCallback(
    (zoom: number) => {
      if (typeof zoom !== "number" || !isFinite(zoom)) return;
      const container = document.getElementById(uid);
      if (!container) return;
      const rect = container.getBoundingClientRect();
      dispatch({
        type: "ZOOM_TO",
        payload: { zoom, centerX: rect.width / 2, centerY: rect.height / 2 },
      });
    },
    [dispatch, uid],
  );

  useImperativeHandle(ref, () => ({
    getElement: () => flowRef.current ?? undefined,
    fitView: (options) => doFitView(options),
    zoomIn: () => zoomBy(ZOOM_FACTOR),
    zoomOut: () => zoomBy(1 / ZOOM_FACTOR),
    zoomTo: (zoom) => zoomTo(zoom),
  }));

  return (
    <div
      id={`${uid}-flow`}
      ref={flowRef}
      className={["dag-flow", className].filter(Boolean).join(" ")}
      style={
        {
          "--dag-flow-h-gap": `${hGap}px`,
          "--dag-flow-v-gap": `${vGap}px`,
          "--dag-flow-line-width": `${lineWidth}px`,
          "--dag-flow-line-color": lineColor,
          ...style,
        } as CSSProperties
      }
    >
      <EdgeLayer
        edges={edges}
        positions={effPositions}
        dimensions={nodeDimensions}
        connectingEdge={connectingEdge}
      />
      {flatNodes.map((nodeId) => {
        const node = nodeMap?.get(nodeId);
        const selectable = node?.selectable ?? nodesSelectable;
        return (
          <NodeWrapper
            key={nodeId}
            id={nodeId}
            type={node?.type}
            data={node?.data}
            selectable={selectable}
            isSelected={selectedNodes.has(nodeId)}
            position={effPositions.get(nodeId)}
          />
        );
      })}
    </div>
  );
});

export default FlowInternal;

function computeFlowDepsStr(flow: unknown): string {
  try {
    return JSON.stringify(flow);
  } catch {
    return "error";
  }
}
