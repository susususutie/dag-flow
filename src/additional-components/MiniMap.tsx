import { useCallback, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import useCanvasState from "../hooks/useCanvasState.ts";
import useCanvasDispatch from "../hooks/useCanvasDispatch.ts";
import useCanvasTransform from "../hooks/useCanvasTransform.ts";
import useRafCanvasDispatch from "../hooks/useRafCanvasDispatch.ts";
import useSize from "../hooks/useSize.ts";
import type { PanelPosition } from "../types/index.ts";

export interface MiniMapProps {
  /** 小地图宽度，默认 198 */
  width?: number;
  /** 小地图高度，默认 110 */
  height?: number;
  /** 是否可拖拽/点击平移视口（React Flow MiniMap pannable），默认 false */
  pannable?: boolean;
  /** 是否可滚轮缩放视口（React Flow MiniMap zoomable），默认 false */
  zoomable?: boolean;
  /** 内容超出视口时才显示，默认 false */
  autoShow?: boolean;
  /**
   * 画布内停靠位置（绝对定位），默认 "bottom-right"；
   * "none" 不做定位，由外部容器（如自定义 div）负责布局。
   */
  position?: PanelPosition;
}

const POSITION_OFFSET: Record<PanelPosition, CSSProperties> = {
  "top-left": { top: 16, left: 16 },
  "top-right": { top: 16, right: 16 },
  "bottom-left": { bottom: 16, left: 16 },
  "bottom-right": { bottom: 16, right: 16 },
  none: {},
};

/**
 * 地图组件。
 */
export default function MiniMap(props: MiniMapProps) {
  const {
    width = 198,
    height = 110,
    autoShow = false,
    pannable = false,
    zoomable = false,
    position = "bottom-right",
  } = props;

  const { uid, flow, nodeDimensions, nodeMap } = useCanvasState();
  const { x, y, zoom } = useCanvasTransform();
  const dispatch = useCanvasDispatch();
  const dispatchOnAnimationFrame = useRafCanvasDispatch();

  const layoutRef = useRef<HTMLDivElement>(null);

  const getContainer = useCallback(() => document.getElementById(uid), [uid]);
  const containerSize = useSize(getContainer);
  const minimapRef = useRef<HTMLDivElement>(null);
  const minimapWrapperSize = useSize(minimapRef);

  const nodes = useMemo(() => {
    const allNodes = flow.flat().flat();
    const list: { id: string; x: number; y: number; width: number; height: number }[] = [];
    for (const id of allNodes) {
      const dims = nodeDimensions.get(id);
      if (!dims?.width || !dims.height) continue;
      const pos = nodeMap?.get(id)?.position;
      if (!pos) continue;
      list.push({ id, x: pos.x, y: pos.y, width: dims.width, height: dims.height });
    }
    return list;
  }, [flow, nodeDimensions, nodeMap]);
  const flowOriginSize = useMemo(
    () =>
      nodes.reduce(
        (acc, node) => ({
          minLeft: Math.min(acc.minLeft, node.x),
          minTop: Math.min(acc.minTop, node.y),
          maxLeft: Math.max(acc.maxLeft, node.x + node.width),
          maxTop: Math.max(acc.maxTop, node.y + node.height),
        }),
        { minLeft: Infinity, minTop: Infinity, maxLeft: -Infinity, maxTop: -Infinity },
      ),
    [nodes],
  );
  const originWidth = flowOriginSize.maxLeft - flowOriginSize.minLeft;
  const originHeight = flowOriginSize.maxTop - flowOriginSize.minTop;
  const flowScale = useMemo(() => {
    if (!Number.isFinite(originWidth) || !Number.isFinite(originHeight)) return null;
    if (originWidth && originHeight && minimapWrapperSize?.width && minimapWrapperSize?.height) {
      let calcScale: number;
      if (originWidth / originHeight > minimapWrapperSize.width / minimapWrapperSize.height) {
        calcScale = minimapWrapperSize.width / originWidth;
      } else {
        calcScale = minimapWrapperSize.height / originHeight;
      }
      return Math.min(calcScale, 0.08);
    }
    return null;
  }, [originWidth, originHeight, minimapWrapperSize?.width, minimapWrapperSize?.height]);

  const nodeElements = useMemo(() => {
    if (flowScale === null) return [];
    return nodes.map((node) => (
      <div
        key={node.id}
        className="dag-flow-minimap__node"
        style={{
          left: node.x * flowScale,
          top: node.y * flowScale,
          width: node.width * flowScale,
          height: node.height * flowScale,
        }}
      />
    ));
  }, [flowScale, nodes]);

  const isDraggingRef = useRef(false);
  const dragLastRef = useRef({ x: 0, y: 0 });

  const hide =
    !containerSize ||
    !flowOriginSize ||
    (containerSize.width / zoom > originWidth && containerSize.height / zoom > originHeight);
  if (hide && autoShow) return null;

  const handleClick = (e: React.MouseEvent) => {
    if (!pannable || !flowScale || !containerSize) return;
    e.stopPropagation();
    const rect = layoutRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const transformX = (-clickX / flowScale) * zoom + containerSize.width / 2;
    const transformY = (-clickY / flowScale) * zoom + containerSize.height / 2;
    dispatch({ type: "PAN", payload: { x: transformX, y: transformY } });
  };
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!pannable || !dispatch) return;
    isDraggingRef.current = true;
    dragLastRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
    e.preventDefault();
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pannable || !isDraggingRef.current || !dispatch || !flowScale) return;
    const dx = e.clientX - dragLastRef.current.x;
    const dy = e.clientY - dragLastRef.current.y;
    if (dx === 0 && dy === 0) return;
    dragLastRef.current = { x: e.clientX, y: e.clientY };

    const canvasDx = -(dx / flowScale) * zoom;
    const canvasDy = -(dy / flowScale) * zoom;

    dispatchOnAnimationFrame({ type: "PAN_BY", payload: { dx: canvasDx, dy: canvasDy } });
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };
  // 滚轮缩放视口（React Flow MiniMap zoomable），以视口中心为锚点
  const handleWheel = (e: React.WheelEvent) => {
    if (!zoomable || !containerSize) return;
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    dispatch({
      type: "ZOOM",
      payload: { delta, mouseX: containerSize.width / 2, mouseY: containerSize.height / 2 },
    });
  };

  const wrapperStyle: CSSProperties = {
    ...POSITION_OFFSET[position],
    ...(position === "none" ? {} : { position: "absolute", zIndex: 30 }),
    width,
    height,
    cursor: pannable ? "move" : "default",
  };

  return (
    <div
      className="dag-flow-minimap"
      style={wrapperStyle}
      data-testid="minimap"
      onClick={handleClick}
      onWheel={handleWheel}
    >
      <div ref={minimapRef} className="dag-flow-minimap__center">
        {flowScale && containerSize ? (
          <div
            ref={layoutRef}
            className="dag-flow-minimap__layout"
            style={{
              width: originWidth * flowScale,
              height: originHeight * flowScale,
            }}
          >
            <div className="dag-flow-minimap__nodes">{nodeElements}</div>
            <div
              data-testid="minimap-view-box"
              className="dag-flow-minimap__view-box"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onLostPointerCapture={() => {
                isDraggingRef.current = false;
              }}
              style={{
                cursor: pannable ? "move" : "default",
                width: containerSize.width * flowScale,
                height: containerSize.height * flowScale,
                transform: `translate(${(-x * flowScale) / zoom}px, ${(-y * flowScale) / zoom}px) scale(${1 / zoom})`,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
