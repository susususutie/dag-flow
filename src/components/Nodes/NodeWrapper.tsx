import { useCallback, useMemo, useRef } from "react";
import type {
  HTMLAttributes,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import useCanvasState from "../../hooks/useCanvasState.ts";
import useCanvasTransform from "../../hooks/useCanvasTransform.ts";
import useCanvasDispatch from "../../hooks/useCanvasDispatch.ts";
import useCanvasInteraction from "../../hooks/useCanvasInteraction.ts";
import useNodeObserver from "../../hooks/useNodeObserver.ts";
import { NodeContext } from "../../contexts/StoreContext.tsx";
import DefaultNode from "./DefaultNode.tsx";
import { reconnectNode } from "../../utils/reconnect.ts";
import type { NodeComponentProps, XYPosition } from "../../types/index.ts";
import type { CSSProperties } from "react";

interface NodeWrapperProps extends HTMLAttributes<HTMLDivElement> {
  isEnd?: boolean;
  id: string;
  type?: string;
  data?: Record<string, unknown>;
  selectable?: boolean;
  draggable?: boolean;
  isSelected?: boolean;
  /** 绝对定位坐标（布局引擎输出）；缺省时回退到默认位置 */
  position?: XYPosition;
}

/** 节点外层包裹：负责绝对定位、尺寸观察与交互分发；视觉反馈由节点组件根据 selectable/selected 自行实现 */
export default function NodeWrapper(props: NodeWrapperProps) {
  const { id, type, data, selectable, draggable, isSelected, position, ...rest } = props;
  const { nodeTypes, flow } = useCanvasState();
  const { zoom: zoomValue } = useCanvasTransform();
  const dispatch = useCanvasDispatch();
  const { onNodeClick } = useCanvasInteraction();

  // 节点点击统一处理：选中 + 通知业务回调（React Flow onNodeClick），自定义节点无需自行绑定
  const handleClick = useCallback(
    (e: ReactMouseEvent) => {
      if (selectable) {
        dispatch({ type: "UPDATE_SELECTED_NODE", payload: { id } });
      }
      onNodeClick?.(e as unknown as MouseEvent, { id, type, data, selectable });
    },
    [selectable, dispatch, onNodeClick, id, type, data],
  );

  const nodeProviderValue = useMemo(
    () => ({
      id,
      type,
      data,
      selectable,
      selected: isSelected,
      isSelected,
      position,
      draggable,
    }),
    [id, type, data, selectable, isSelected, position, draggable],
  );

  const style = useMemo<CSSProperties>(
    () => ({
      left: position?.x ?? 0,
      top: position?.y ?? 0,
    }),
    [position],
  );

  const ref = useRef<HTMLDivElement>(null);
  useNodeObserver(id, ref);

  const dragStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    startPos: XYPosition;
  } | null>(null);

  // 节点拖动（RF XYDrag 对齐）：pointerdown 阻断画布平移 → 拖动中写 dragPositions →
  // 松手 COMMIT 焊死 position；受控模式外部未写回时由 StoreUpdater 覆盖实现回弹
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return;
      if (draggable === false) return;
      const flowEl = e.currentTarget.closest(".dag-flow") as HTMLElement | null;
      if (!flowEl) return;
      const rect = flowEl.getBoundingClientRect();
      const scaleX = flowEl.offsetWidth ? rect.width / flowEl.offsetWidth : 1;
      const scaleY = flowEl.offsetHeight ? rect.height / flowEl.offsetHeight : 1;
      const zoom = zoomValue || 1;
      const startPos = position ?? { x: 0, y: 0 };
      dragStateRef.current = { startClientX: e.clientX, startClientY: e.clientY, startPos };
      e.stopPropagation();
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const drag = dragStateRef.current;
        if (!drag) return;
        const dx = (ev.clientX - drag.startClientX) / (scaleX * zoom);
        const dy = (ev.clientY - drag.startClientY) / (scaleY * zoom);
        dispatch({
          type: "UPDATE_NODE_POSITION",
          payload: { id, position: { x: drag.startPos.x + dx, y: drag.startPos.y + dy } },
        });
      };
      const onUp = (ev: PointerEvent) => {
        const drag = dragStateRef.current;
        dragStateRef.current = null;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        if (!drag) return;
        const dx = (ev.clientX - drag.startClientX) / (scaleX * zoom);
        const dy = (ev.clientY - drag.startClientY) / (scaleY * zoom);
        dispatch({
          type: "COMMIT_NODE_POSITIONS",
          payload: {
            positions: new Map([[id, { x: drag.startPos.x + dx, y: drag.startPos.y + dy }]]),
            clearIds: [id],
          },
        });
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [dispatch, id, draggable, position, zoomValue],
  );

  // 连接手柄：从源节点右侧拖出到目标节点，松手后将目标重连到源之后
  const startConnect = useCallback(
    (e: ReactMouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const flowEl = e.currentTarget.closest(".dag-flow") as HTMLElement | null;
      if (!flowEl) return;
      const rect = flowEl.getBoundingClientRect();
      const scaleX = flowEl.offsetWidth ? rect.width / flowEl.offsetWidth : 1;
      const scaleY = flowEl.offsetHeight ? rect.height / flowEl.offsetHeight : 1;

      const toCanvas = (clientX: number, clientY: number): XYPosition => ({
        x: (clientX - rect.left) / scaleX,
        y: (clientY - rect.top) / scaleY,
      });
      dispatch({
        type: "UPDATE_CONNECTING",
        payload: { edge: { source: id, position: toCanvas(e.clientX, e.clientY) } },
      });

      const onMove = (ev: globalThis.MouseEvent) => {
        dispatch({
          type: "UPDATE_CONNECTING",
          payload: { edge: { source: id, position: toCanvas(ev.clientX, ev.clientY) } },
        });
      };
      const onUp = (ev: globalThis.MouseEvent) => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        dispatch({ type: "UPDATE_CONNECTING", payload: { edge: null } });

        const targetEl = document
          .elementFromPoint(ev.clientX, ev.clientY)
          ?.closest("[data-node-id]") as HTMLElement | null;
        const targetId = targetEl?.getAttribute("data-node-id");
        if (!targetId || targetId === id) return;
        const nextFlow = reconnectNode(flow, targetId, id);
        if (nextFlow) dispatch({ type: "SET_FLOW", payload: nextFlow });
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [dispatch, flow, id],
  );

  const NodeComponent = (type == null ? undefined : nodeTypes?.[type]) ?? DefaultNode;
  return (
    <div {...rest} className="dag-flow-node-wrapper" style={style}>
      <NodeContext.Provider value={nodeProviderValue}>
        <div
          data-node-id={id}
          data-nopan
          ref={ref}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          className={draggable === false ? "dag-flow-node--locked" : "dag-flow-node--draggable"}
        >
          <NodeComponent {...(nodeProviderValue as NodeComponentProps)} />
        </div>
        <span
          className="dag-flow-handle dag-flow-handle--source"
          data-handle="source"
          title="拖拽连接到后续节点"
          onMouseDown={startConnect}
        />
      </NodeContext.Provider>
    </div>
  );
}
