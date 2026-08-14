import { Position } from "../../types/edges.ts";

/**
 * 边路径生成器：移植自 @xyflow/system（React Flow 内核，MIT License）。
 * 签名与行为保持与 React Flow 一致，便于自定义边在 dag-flow 与 React Flow 间复用。
 * 参考：@xyflow/system@0.0.79 index.mjs getBezierPath/getStraightPath/getSmoothStepPath
 */

export interface GetSmoothStepPathParams {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
  borderRadius?: number;
  centerX?: number;
  centerY?: number;
  offset?: number;
  stepPosition?: number;
}

export type PathResult = [
  path: string,
  labelX: number,
  labelY: number,
  offsetX: number,
  offsetY: number,
];

function getEdgeCenter(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): [number, number, number, number] {
  const xOffset = Math.abs(targetX - sourceX) / 2;
  const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;
  const yOffset = Math.abs(targetY - sourceY) / 2;
  const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;
  return [centerX, centerY, xOffset, yOffset];
}

function getBezierEdgeCenter(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceControlX: number,
  sourceControlY: number,
  targetControlX: number,
  targetControlY: number,
): [number, number, number, number] {
  const centerX =
    sourceX * 0.125 + sourceControlX * 0.375 + targetControlX * 0.375 + targetX * 0.125;
  const centerY =
    sourceY * 0.125 + sourceControlY * 0.375 + targetControlY * 0.375 + targetY * 0.125;
  const offsetX = Math.abs(centerX - sourceX);
  const offsetY = Math.abs(centerY - sourceY);
  return [centerX, centerY, offsetX, offsetY];
}

function calculateControlOffset(distance: number, curvature: number): number {
  if (distance >= 0) {
    return 0.5 * distance;
  }
  return curvature * 25 * Math.sqrt(-distance);
}

function getControlWithCurvature(
  pos: Position,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  c: number,
): [number, number] {
  switch (pos) {
    case Position.Left:
      return [x1 - calculateControlOffset(x1 - x2, c), y1];
    case Position.Right:
      return [x1 + calculateControlOffset(x2 - x1, c), y1];
    case Position.Top:
      return [x1, y1 - calculateControlOffset(y1 - y2, c)];
    case Position.Bottom:
      return [x1, y1 + calculateControlOffset(y2 - y1, c)];
    default:
      return [x1, y1];
  }
}

export interface GetBezierPathParams {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
  curvature?: number;
}

export function getBezierPath({
  sourceX,
  sourceY,
  sourcePosition = Position.Bottom,
  targetX,
  targetY,
  targetPosition = Position.Top,
  curvature = 0.25,
}: GetBezierPathParams): PathResult {
  const [sourceControlX, sourceControlY] = getControlWithCurvature(
    sourcePosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    curvature,
  );
  const [targetControlX, targetControlY] = getControlWithCurvature(
    targetPosition,
    targetX,
    targetY,
    sourceX,
    sourceY,
    curvature,
  );
  const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter(
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY,
  );
  return [
    `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
    labelX,
    labelY,
    offsetX,
    offsetY,
  ];
}

export interface GetStraightPathParams {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export function getStraightPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: GetStraightPathParams): PathResult {
  const [labelX, labelY, offsetX, offsetY] = getEdgeCenter(sourceX, sourceY, targetX, targetY);
  return [`M ${sourceX},${sourceY}L ${targetX},${targetY}`, labelX, labelY, offsetX, offsetY];
}

// ---------- smoothstep ----------

export interface Point {
  x: number;
  y: number;
}

const handleDirections: Record<Position, Point> = {
  [Position.TopLeft]: { x: -1, y: -1 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.TopRight]: { x: 1, y: -1 },
  [Position.Left]: { x: -1, y: 0 },
  [Position.Center]: { x: 0, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.BottomLeft]: { x: -1, y: 1 },
  [Position.Bottom]: { x: 0, y: 1 },
  [Position.BottomRight]: { x: 1, y: 1 },
};

function getDirection(source: Point, sourcePosition: Position, target: Point) {
  if (sourcePosition === Position.Left || sourcePosition === Position.Right) {
    return source.x < target.x ? { x: 1, y: 0 } : { x: -1, y: 0 };
  }
  return source.y < target.y ? { x: 0, y: 1 } : { x: 0, y: -1 };
}

function distance(a: Point, b: Point): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

function getPoints(
  source: Point,
  sourcePosition: Position,
  target: Point,
  targetPosition: Position,
  center: { x?: number; y?: number },
  offset: number,
  stepPosition: number,
): [Point[], number, number, number, number] {
  const sourceDir = handleDirections[sourcePosition];
  const targetDir = handleDirections[targetPosition];
  const sourceGapped = { x: source.x + sourceDir.x * offset, y: source.y + sourceDir.y * offset };
  const targetGapped = { x: target.x + targetDir.x * offset, y: target.y + targetDir.y * offset };
  const dir = getDirection(sourceGapped, sourcePosition, targetGapped);
  const dirAccessor = dir.x !== 0 ? "x" : "y";
  const currDir = dir[dirAccessor];
  let points: Point[] = [];
  let centerX: number;
  let centerY: number;
  const sourceGapOffset: Point = { x: 0, y: 0 };
  const targetGapOffset: Point = { x: 0, y: 0 };
  const [, , defaultOffsetX, defaultOffsetY] = getEdgeCenter(
    source.x,
    source.y,
    target.x,
    target.y,
  );

  if (sourceDir[dirAccessor] * targetDir[dirAccessor] === -1) {
    if (dirAccessor === "x") {
      centerX = center.x ?? sourceGapped.x + (targetGapped.x - sourceGapped.x) * stepPosition;
      centerY = center.y ?? (sourceGapped.y + targetGapped.y) / 2;
    } else {
      centerX = center.x ?? (sourceGapped.x + targetGapped.x) / 2;
      centerY = center.y ?? sourceGapped.y + (targetGapped.y - sourceGapped.y) * stepPosition;
    }
    const verticalSplit: Point[] = [
      { x: centerX, y: sourceGapped.y },
      { x: centerX, y: targetGapped.y },
    ];
    const horizontalSplit: Point[] = [
      { x: sourceGapped.x, y: centerY },
      { x: targetGapped.x, y: centerY },
    ];
    if (sourceDir[dirAccessor] === currDir) {
      points = dirAccessor === "x" ? verticalSplit : horizontalSplit;
    } else {
      points = dirAccessor === "x" ? horizontalSplit : verticalSplit;
    }
  } else {
    const sourceTarget: Point[] = [{ x: sourceGapped.x, y: targetGapped.y }];
    const targetSource: Point[] = [{ x: targetGapped.x, y: sourceGapped.y }];
    if (dirAccessor === "x") {
      points = sourceDir.x === currDir ? targetSource : sourceTarget;
    } else {
      points = sourceDir.y === currDir ? sourceTarget : targetSource;
    }
    if (sourcePosition === targetPosition) {
      const diff = Math.abs(source[dirAccessor] - target[dirAccessor]);
      if (diff <= offset) {
        const gapOffset = Math.min(offset - 1, offset - diff);
        if (sourceDir[dirAccessor] === currDir) {
          sourceGapOffset[dirAccessor] =
            (sourceGapped[dirAccessor] > source[dirAccessor] ? -1 : 1) * gapOffset;
        } else {
          targetGapOffset[dirAccessor] =
            (targetGapped[dirAccessor] > target[dirAccessor] ? -1 : 1) * gapOffset;
        }
      }
    }
    if (sourcePosition !== targetPosition) {
      const dirAccessorOpposite = dirAccessor === "x" ? "y" : "x";
      const isSameDir = sourceDir[dirAccessor] === targetDir[dirAccessorOpposite];
      const sourceGtTargetOppo =
        sourceGapped[dirAccessorOpposite] > targetGapped[dirAccessorOpposite];
      const sourceLtTargetOppo =
        sourceGapped[dirAccessorOpposite] < targetGapped[dirAccessorOpposite];
      const flipSourceTarget =
        (sourceDir[dirAccessor] === 1 &&
          ((!isSameDir && sourceGtTargetOppo) || (isSameDir && sourceLtTargetOppo))) ||
        (sourceDir[dirAccessor] !== 1 &&
          ((!isSameDir && sourceLtTargetOppo) || (isSameDir && sourceGtTargetOppo)));
      if (flipSourceTarget) {
        points = dirAccessor === "x" ? sourceTarget : targetSource;
      }
    }
    const sourceGapPoint = {
      x: sourceGapped.x + sourceGapOffset.x,
      y: sourceGapped.y + sourceGapOffset.y,
    };
    const targetGapPoint = {
      x: targetGapped.x + targetGapOffset.x,
      y: targetGapped.y + targetGapOffset.y,
    };
    const maxXDistance = Math.max(
      Math.abs(sourceGapPoint.x - points[0].x),
      Math.abs(targetGapPoint.x - points[0].x),
    );
    const maxYDistance = Math.max(
      Math.abs(sourceGapPoint.y - points[0].y),
      Math.abs(targetGapPoint.y - points[0].y),
    );
    if (maxXDistance >= maxYDistance) {
      centerX = (sourceGapPoint.x + targetGapPoint.x) / 2;
      centerY = points[0].y;
    } else {
      centerX = points[0].x;
      centerY = (sourceGapPoint.y + targetGapPoint.y) / 2;
    }
  }
  const gappedSource = {
    x: sourceGapped.x + sourceGapOffset.x,
    y: sourceGapped.y + sourceGapOffset.y,
  };
  const gappedTarget = {
    x: targetGapped.x + targetGapOffset.x,
    y: targetGapped.y + targetGapOffset.y,
  };
  const pathPoints: Point[] = [
    source,
    ...(gappedSource.x !== points[0].x || gappedSource.y !== points[0].y ? [gappedSource] : []),
    ...points,
    ...(gappedTarget.x !== points[points.length - 1].x ||
    gappedTarget.y !== points[points.length - 1].y
      ? [gappedTarget]
      : []),
    target,
  ];
  return [pathPoints, centerX, centerY, defaultOffsetX, defaultOffsetY];
}

function getBend(a: Point, b: Point, c: Point, size: number): string {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
  const { x, y } = b;
  if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
    return `L${x} ${y}`;
  }
  if (a.y === y) {
    const xDir = a.x < c.x ? -1 : 1;
    const yDir = a.y < c.y ? 1 : -1;
    return `L ${x + bendSize * xDir},${y}Q ${x},${y} ${x},${y + bendSize * yDir}`;
  }
  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`;
}

/** 将一组明确的正交折点转换为带圆角的 SVG path。 */
export function getRoundedPath(input: Point[], borderRadius = 5): string {
  const points = input.filter(
    (point, index) =>
      index === 0 || point.x !== input[index - 1].x || point.y !== input[index - 1].y,
  );
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`;

  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    path += getBend(points[i - 1], points[i], points[i + 1], borderRadius);
  }
  return `${path}L${points[points.length - 1].x} ${points[points.length - 1].y}`;
}

export function getSmoothStepPath({
  sourceX,
  sourceY,
  sourcePosition = Position.Bottom,
  targetX,
  targetY,
  targetPosition = Position.Top,
  borderRadius = 5,
  centerX,
  centerY,
  offset = 20,
  stepPosition = 0.5,
}: GetSmoothStepPathParams): PathResult {
  const [points, labelX, labelY, offsetX, offsetY] = getPoints(
    { x: sourceX, y: sourceY },
    sourcePosition,
    { x: targetX, y: targetY },
    targetPosition,
    { x: centerX, y: centerY },
    offset,
    stepPosition,
  );
  const path = getRoundedPath(points, borderRadius);
  return [path, labelX, labelY, offsetX, offsetY];
}
