import useCanvasTransform from "../hooks/useCanvasTransform.ts";

export interface BackgroundProps {
  /** 背景颜色，默认 'transparent' */
  backgroundColor?: string;
  /** 圆点颜色，默认 '#e0e0e0cc' */
  color?: string;
  /** 圆点间距，默认 20 */
  size?: number;
  /** 圆点半径，默认 1 */
  radius?: number;
}

/**
 * 背景组件：随画布缩放/移动的点阵背景，不固定在画布上。
 */
export default function Background({
  backgroundColor = "transparent",
  color = "#e0e0e0cc",
  size = 20,
  radius = 1,
}: BackgroundProps) {
  const transform = useCanvasTransform();
  const sizeWithScale = size * transform.zoom;
  const radiusWithScale = radius * transform.zoom;
  const centerX = transform.x % sizeWithScale;
  const centerY = transform.y % sizeWithScale;

  return (
    <div
      className="dag-flow-background"
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(circle at ${sizeWithScale / 2}px ${sizeWithScale / 2}px, ${color} ${radiusWithScale}px, transparent ${radiusWithScale}px)`,
        backgroundSize: `${sizeWithScale}px ${sizeWithScale}px`,
        backgroundPosition: `${centerX}px ${centerY}px`,
      }}
    />
  );
}
