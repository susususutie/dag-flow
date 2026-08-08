import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { CanvasInstanceContext, DAGInstanceContext } from "../../contexts/StoreContext.tsx";
import ZoomPane from "./ZoomPane.tsx";
import Pane from "./Pane.tsx";
import Viewport from "./Viewport.tsx";
import Flow from "../../components/Flow/Flow.tsx";
import type { FlowHandle } from "../../components/Flow/Flow.tsx";
import useKeyboardHook from "../../hooks/useKeyboardHook.ts";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";
import type { DAGNode, FlowModel, ViewApi, Viewport as ViewportType } from "../../types/index.ts";
import type { FitViewOptions } from "../../types/index.ts";

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
  layout: () => void;
}

const GraphView = forwardRef<GraphViewHandle, { children?: ReactNode }>(
  function GraphView(props, ref) {
    const { children } = props;
    const instance = useContext(CanvasInstanceContext);
    const dag = useContext(DAGInstanceContext);
    const flowRef = useRef<FlowHandle>(null);
    const dispatch = useCanvasDispatch();
    const layout = useCallback(() => {
      dispatch({ type: "FORCE_LAYOUT" });
    }, [dispatch]);

    const viewApi = useMemo<ViewApi>(
      () => ({
        getFlowElement: () => flowRef.current?.getElement(),
        fitView: (fitOptions?: FitViewOptions) => flowRef.current?.fitView(fitOptions),
        zoomIn: () => flowRef.current?.zoomIn(),
        zoomOut: () => flowRef.current?.zoomOut(),
        zoomTo: (zoom) => flowRef.current?.zoomTo(zoom),
        layout,
      }),
      [layout],
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
      getFlowElement: () => viewApi.getFlowElement(),
      fitView: (options) => viewApi.fitView(options),
      zoomIn: () => viewApi.zoomIn(),
      zoomOut: () => viewApi.zoomOut(),
      zoomTo: (zoom) => viewApi.zoomTo(zoom),
      getViewport: () => {
        const { x, y, zoom } = instance?.getTransform() ?? { x: 0, y: 0, zoom: 1 };
        return { x, y, zoom };
      },
      layout: () => viewApi.layout(),
    }));

    useKeyboardHook();

    return (
      <>
        <ZoomPane>
          <Pane>
            <Viewport>
              <Flow ref={flowRef} />
            </Viewport>
          </Pane>
        </ZoomPane>
        {children}
      </>
    );
  },
);

export default GraphView;
