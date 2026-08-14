import type { DAGNode, FlowDirection, FlowModel, FlowPath, XYPosition } from "../../types/index.ts";
import Flow from "../Flow.ts";
import { getSourcePoint, getTargetPoint } from "./points.ts";
import { getRoundedPath } from "./paths.ts";

const DEFAULT_DIMENSIONS = { width: 150, height: 40 };
const DEFAULT_BUS_OFFSET = 80;

interface NodeGeometry {
  id: string;
  source: XYPosition;
  target: XYPosition;
  secondaryStart: number;
  secondaryEnd: number;
}

interface StepGeometry {
  parallel: boolean;
  paths: NodeGeometry[][];
  heads: NodeGeometry[];
  tails: NodeGeometry[];
  rawEntry: XYPosition;
  rawExit: XYPosition;
  centerSecondary: number;
  entry?: XYPosition;
  exit?: XYPosition;
}

export interface FlowEdgeRoute {
  id: string;
  points: XYPosition[];
}

function primary(direction: FlowDirection, point: XYPosition): number {
  return direction === "horizontal" ? point.x : point.y;
}

function secondary(direction: FlowDirection, point: XYPosition): number {
  return direction === "horizontal" ? point.y : point.x;
}

function point(direction: FlowDirection, primaryValue: number, secondaryValue: number): XYPosition {
  return direction === "horizontal"
    ? { x: primaryValue, y: secondaryValue }
    : { x: secondaryValue, y: primaryValue };
}

function positiveOffset(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function connectOrthogonally(
  direction: FlowDirection,
  source: XYPosition,
  target: XYPosition,
): XYPosition[] {
  if (secondary(direction, source) === secondary(direction, target)) return [source, target];
  const middle = (primary(direction, source) + primary(direction, target)) / 2;
  return [
    source,
    point(direction, middle, secondary(direction, source)),
    point(direction, middle, secondary(direction, target)),
    target,
  ];
}

function createStepGeometry(
  step: string | FlowPath[],
  nodeMap: Map<string, DAGNode>,
  dimensions: Map<string, { width: number; height: number }>,
  direction: FlowDirection,
): StepGeometry | null {
  const parallel = typeof step !== "string";
  const paths = (parallel ? step : [[step]])
    .map((path) =>
      path.flatMap((id) => {
        const node = nodeMap.get(id);
        if (!node?.position) return [];
        const size = dimensions.get(id) ?? DEFAULT_DIMENSIONS;
        return [
          {
            id,
            source: getSourcePoint(direction, node.position, size),
            target: getTargetPoint(direction, node.position, size),
            secondaryStart: direction === "horizontal" ? node.position.y : node.position.x,
            secondaryEnd:
              (direction === "horizontal" ? node.position.y : node.position.x) +
              (direction === "horizontal" ? size.height : size.width),
          },
        ];
      }),
    )
    .filter((path) => path.length > 0);
  if (paths.length === 0) return null;

  const heads = paths.map((path) => path[0]);
  const tails = paths.map((path) => path[path.length - 1]);
  const nodes = paths.flat();
  const centerSecondary =
    (Math.min(...nodes.map((node) => node.secondaryStart)) +
      Math.max(...nodes.map((node) => node.secondaryEnd))) /
    2;
  const rawEntry = point(
    direction,
    Math.min(...heads.map((node) => primary(direction, node.target))),
    centerSecondary,
  );
  const rawExit = point(
    direction,
    Math.max(...tails.map((node) => primary(direction, node.source))),
    centerSecondary,
  );

  return { parallel, paths, heads, tails, rawEntry, rawExit, centerSecondary };
}

function inferInternalOffset(direction: FlowDirection, step: StepGeometry): number | null {
  const gaps = step.paths.flatMap((path) =>
    path.slice(1).map((node, index) => {
      const previous = path[index];
      return primary(direction, node.target) - primary(direction, previous.source);
    }),
  );
  const positiveGaps = gaps.filter((gap) => gap > 0);
  return positiveGaps.length > 0 ? Math.min(...positiveGaps) : null;
}

/**
 * 将嵌套 flow 转换为共享分叉/汇合点的正交边网络。
 * 并行组的汇合点始终位于最长路径之后，短路径会延伸到同一条总线。
 */
export function getFlowEdgeRoutes(
  flow: FlowModel,
  nodeMap: Map<string, DAGNode>,
  dimensions: Map<string, { width: number; height: number }>,
  direction: FlowDirection,
): FlowEdgeRoute[] {
  const steps = new Flow(flow).toArray().flatMap((step) => {
    const geometry = createStepGeometry(step, nodeMap, dimensions, direction);
    return geometry ? [geometry] : [];
  });
  const trunkSecondary =
    steps.find((step) => !step.parallel)?.centerSecondary ?? steps[0]?.centerSecondary ?? 0;

  for (let index = 0; index < steps.length; index++) {
    const step = steps[index];
    if (!step.parallel) {
      step.entry = step.rawEntry;
      step.exit = step.rawExit;
      continue;
    }

    const previous = steps[index - 1];
    const next = steps[index + 1];
    const internalOffset = inferInternalOffset(direction, step);
    const fallback = internalOffset ?? DEFAULT_BUS_OFFSET;
    const entryGap = previous
      ? primary(direction, step.rawEntry) - primary(direction, previous.rawExit)
      : primary(direction, step.rawEntry);
    const entryDivisor = previous?.parallel ? 3 : previous ? 2 : 1;
    const entryOffset = positiveOffset(entryGap / entryDivisor, fallback);
    const exitGap = next
      ? primary(direction, next.rawEntry) - primary(direction, step.rawExit)
      : entryOffset;
    const exitDivisor = next?.parallel ? 3 : next ? 2 : 1;
    const exitOffset = positiveOffset(exitGap / exitDivisor, entryOffset);

    step.entry = point(direction, primary(direction, step.rawEntry) - entryOffset, trunkSecondary);
    step.exit = point(direction, primary(direction, step.rawExit) + exitOffset, trunkSecondary);
  }

  const routes: FlowEdgeRoute[] = [];
  steps.forEach((step, stepIndex) => {
    const previous = steps[stepIndex - 1];
    if (previous?.exit && step.entry) {
      routes.push({
        id: `transition:${stepIndex - 1}->${stepIndex}`,
        points: connectOrthogonally(direction, previous.exit, step.entry),
      });
    }

    if (step.parallel && step.entry && step.exit) {
      for (const head of step.heads) {
        routes.push({
          id: `split:${stepIndex}:${head.id}`,
          points: [
            step.entry,
            point(direction, primary(direction, step.entry), secondary(direction, head.target)),
            head.target,
          ],
        });
      }
    }

    for (const path of step.paths) {
      for (let nodeIndex = 1; nodeIndex < path.length; nodeIndex++) {
        const source = path[nodeIndex - 1];
        const target = path[nodeIndex];
        routes.push({
          id: `path:${source.id}->${target.id}`,
          points: connectOrthogonally(direction, source.source, target.target),
        });
      }
    }

    if (step.parallel && step.exit) {
      for (const tail of step.tails) {
        routes.push({
          id: `merge:${stepIndex}:${tail.id}`,
          points: [
            tail.source,
            point(direction, primary(direction, step.exit), secondary(direction, tail.source)),
            step.exit,
          ],
        });
      }
    }
  });

  return routes;
}

export function getFlowEdgePath(
  flow: FlowModel,
  nodeMap: Map<string, DAGNode>,
  dimensions: Map<string, { width: number; height: number }>,
  direction: FlowDirection,
): string {
  return getFlowEdgeRoutes(flow, nodeMap, dimensions, direction)
    .map((route) => getRoundedPath(route.points))
    .join(" ");
}
