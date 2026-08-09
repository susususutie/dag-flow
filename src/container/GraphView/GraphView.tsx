import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { CanvasInstanceContext, DAGInstanceContext } from "../../contexts/StoreContext.tsx";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";
import useCanvasState from "../../hooks/useCanvasState.ts";
import useKeyboardHook from "../../hooks/useKeyboardHook.ts";
import type {
  DAGNode,
  FitViewOptions,
  FlowModel,
  ViewApi,
  Viewport as ViewportType,
} from "../../types/index.ts";
import computeFitView from "../../utils/geometry.ts";
import { getNodesBounds } from "../../utils/layout.ts";
import EdgeRenderer from "../EdgeRenderer/index.tsx";
import NodeRenderer from "../NodeRenderer/index.tsx";
import Pane from "./Pane.tsx";
import Viewport from "./Viewport.tsx";
import ZoomPane from "./ZoomPane.tsx";

export interface GraphViewHandle {
  getFlow: () => FlowModel;
  getNodes: () => DAGNode[];
  deleteNode: (node: string | DAGNode) => Promise<{ deletedNodes: DAGNode[] }>;
  deleteNodes: (
    nodes: Array<string | DAGNode> | string | DAGNode,
  ) => Promise<{ deletedNodes: DAGNode[] }>;
  getFlowElement: () => HTMLElement | undefined;
  fitView: (options?: FitViewOptions) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (zoom: number) => void;
  getViewport: () => ViewportType;
}

const GraphView = forwardRef<GraphViewHandle, { children?: ReactNode }>(function GraphView(
  { children },
  ref,
) {
  const instance = useContext(CanvasInstanceContext);
  const dag = useContext(DAGInstanceContext);
  const dispatch = useCanvasDispatch();
  const { uid, nodeMap, nodeDimensions, minZoom, maxZoom, fitView, fitViewOptions } =
    useCanvasState();
  const rendererRef = useRef<HTMLDivElement>(null);
  const positions = useMemo(
    () => new Map(Array.from(nodeMap, ([id, node]) => [id, node.position ?? { x: 0, y: 0 }])),
    [nodeMap],
  );
  const bounds = useMemo(
    () => getNodesBounds(positions, nodeDimensions),
    [nodeDimensions, positions],
  );
  const setRendererRef = useCallback((element: HTMLDivElement | null) => {
    rendererRef.current = element;
  }, []);
  const fitCurrentView = useCallback(
    (options: FitViewOptions = {}) => {
      if (!bounds) return;
      const rect = document.getElementById(uid)?.getBoundingClientRect();
      if (!rect?.width || !rect.height) return;
      dispatch({
        type: "SET_TRANSFORM",
        payload: computeFitView({
          containerWidth: rect.width,
          containerHeight: rect.height,
          contentWidth: bounds.width,
          contentHeight: bounds.height,
          padding: options.padding ?? 0,
          minZoom: options.minZoom ?? minZoom,
          maxZoom: options.maxZoom ?? maxZoom,
          horizontalAlign: options.horizontalAlign,
          verticalAlign: options.verticalAlign,
        }),
      });
    },
    [bounds, dispatch, maxZoom, minZoom, uid],
  );
  const zoomBy = useCallback(
    (factor: number) => {
      const rect = document.getElementById(uid)?.getBoundingClientRect();
      if (!rect) return;
      dispatch({
        type: "ZOOM_TO",
        payload: { factor, centerX: rect.width / 2, centerY: rect.height / 2 },
      });
    },
    [dispatch, uid],
  );
  const zoomTo = useCallback(
    (zoom: number) => {
      if (!Number.isFinite(zoom)) return;
      const rect = document.getElementById(uid)?.getBoundingClientRect();
      if (!rect) return;
      dispatch({
        type: "ZOOM_TO",
        payload: { zoom, centerX: rect.width / 2, centerY: rect.height / 2 },
      });
    },
    [dispatch, uid],
  );
  const didInitialFitView = useRef(false);
  useLayoutEffect(() => {
    if (
      !fitView ||
      didInitialFitView.current ||
      !bounds ||
      nodeMap.size === 0 ||
      nodeMap.size !== nodeDimensions.size
    )
      return;
    didInitialFitView.current = true;
    fitCurrentView(fitViewOptions);
  }, [bounds, fitCurrentView, fitView, fitViewOptions, nodeDimensions.size, nodeMap.size]);

  const viewApi = useMemo<ViewApi>(
    () => ({
      getFlowElement: () => rendererRef.current ?? undefined,
      fitView: fitCurrentView,
      zoomIn: () => zoomBy(1.2),
      zoomOut: () => zoomBy(1 / 1.2),
      zoomTo,
    }),
    [fitCurrentView, zoomBy, zoomTo],
  );

  useEffect(() => {
    instance?.setViewApi(viewApi);
    return () => instance?.clearViewApi(viewApi);
  }, [instance, viewApi]);

  useImperativeHandle(ref, () => ({
    getFlow: () => instance?.getFlow() ?? [],
    getNodes: () => instance?.getNodes() ?? [],
    deleteNode: (node) => dag?.deleteNode(node) ?? Promise.resolve({ deletedNodes: [] }),
    deleteNodes: (nodes) => dag?.deleteNodes(nodes) ?? Promise.resolve({ deletedNodes: [] }),
    getFlowElement: viewApi.getFlowElement,
    fitView: viewApi.fitView,
    zoomIn: viewApi.zoomIn,
    zoomOut: viewApi.zoomOut,
    zoomTo: viewApi.zoomTo,
    getViewport: () => instance?.getTransform() ?? { x: 0, y: 0, zoom: 1 },
  }));

  useKeyboardHook();

  return (
    <ZoomPane ref={setRendererRef}>
      <Pane>
        <Viewport>
          <EdgeRenderer />
          <NodeRenderer />
        </Viewport>
      </Pane>
      <div className="dag-flow__overlay-portal" />
      {children}
    </ZoomPane>
  );
});

export default GraphView;
