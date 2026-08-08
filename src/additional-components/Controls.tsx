import { useMemo } from "react";
import type { CSSProperties } from "react";
import useCanvasState from "../hooks/useCanvasState.ts";
import useCanvasTransform from "../hooks/useCanvasTransform.ts";
import useCanvasDispatch from "../hooks/useCanvasDispatch.ts";
import useDAGInstance from "../hooks/useDAGInstance.ts";
import type { PanelPosition } from "../types/index.ts";

export interface ControlsProps {
  /** 是否显示当前缩放百分比文本，默认 true */
  showZoom?: boolean;
  /** 缩放步进百分比，默认 10 */
  zoomStep?: number;
  /**
   * 画布内停靠位置（绝对定位），默认 "top-left"；
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
 * 缩放控制按钮组（对齐 React Flow Controls）。
 * 按钮禁用态对齐全局缩放边界（minZoom/maxZoom），与 reducer 的缩放 clamp 保持一致。
 */
export default function Controls(props: ControlsProps) {
  const { showZoom = true, zoomStep = 10, position = "top-left" } = props;
  const state = useCanvasState();
  const transform = useCanvasTransform();
  const dispatch = useCanvasDispatch();
  const dagInstance = useDAGInstance();
  const zoom = transform.zoom;
  const scalePercent = Math.round(zoom * 100);
  const minPercent = Math.round(state.minZoom * 100);
  const maxPercent = Math.round(state.maxZoom * 100);

  const zoomTo = (percent: number) => {
    const clamped = Math.max(state.minZoom, Math.min(state.maxZoom, percent / 100));
    dispatch({ type: "SET_TRANSFORM", payload: { zoom: clamped } });
  };

  const wrapperStyle = useMemo<CSSProperties>(
    () => ({
      ...POSITION_OFFSET[position],
      ...(position === "none" ? {} : { position: "absolute", zIndex: 30 }),
    }),
    [position],
  );

  return (
    <div className="dag-flow-controls" style={wrapperStyle} data-testid="controls">
      <button
        type="button"
        aria-label="zoom-out"
        className={`dag-flow-controls__button${
          scalePercent <= minPercent ? " dag-flow-controls__button--disabled" : ""
        }`}
        disabled={scalePercent <= minPercent}
        onClick={() => zoomTo(scalePercent - zoomStep)}
      >
        −
      </button>
      {showZoom && (
        <div className="dag-flow-controls__zoom" data-testid="controls-zoom">
          {scalePercent}%
        </div>
      )}
      <button
        type="button"
        aria-label="zoom-in"
        className={`dag-flow-controls__button${
          scalePercent >= maxPercent ? " dag-flow-controls__button--disabled" : ""
        }`}
        disabled={scalePercent >= maxPercent}
        onClick={() => zoomTo(scalePercent + zoomStep)}
      >
        +
      </button>
      <button
        type="button"
        aria-label="fit-view"
        className="dag-flow-controls__button"
        onClick={() => dagInstance.fitView()}
      >
        ⤢
      </button>
    </div>
  );
}
