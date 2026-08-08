import type { FlowModel, FlowPath, FlowStep, NodePosition, ParallelGroup } from "../types/index.ts";

export interface FlowClipboard {
  steps: FlowStep[];
}

type NormalizedFlow = FlowModel;

/**
 * 嵌套 flow 引擎模型。
 * 标准化数据：复制嵌套路径，并将单路径并行组收缩为串行节点。
 */
export default class Flow {
  data: NormalizedFlow;

  constructor(flow: FlowModel = []) {
    this.data = this._normalize(flow);
  }

  /** 获取节点总个数（串行节点数 + 并行组内所有节点数） */
  get size() {
    return this._countNodes(this.data);
  }

  /** 获取顶层长度（串行节点数 + 并行组数，每个并行组算 1 个位置） */
  get length() {
    return this.data.length;
  }

  /** 标准化数据：复制嵌套路径，并将单路径并行组收缩为串行节点 */
  _normalize(flow: FlowModel): NormalizedFlow {
    const normalized: FlowStep[] = [];
    for (const item of Array.isArray(flow) ? flow : []) {
      if (!Array.isArray(item)) {
        normalized.push(item);
        continue;
      }

      const parallelGroup: ParallelGroup = item
        .map((path) => (Array.isArray(path) ? [...path] : [path]))
        .filter((path) => path.length > 0);
      if (parallelGroup.length === 1) normalized.push(...parallelGroup[0]);
      else if (parallelGroup.length > 1) normalized.push(parallelGroup);
    }
    return normalized;
  }

  /** 转换为数组（标准化输出，返回深副本） */
  toArray(): FlowModel {
    return this.data.map((item) => {
      if (Array.isArray(item)) {
        return item.map((path) => [...path]);
      }
      return item;
    });
  }

  /** 查找节点位置 */
  findNode(nodeId: string): NodePosition | null {
    for (let i = 0; i < this.data.length; i++) {
      const item = this.data[i];

      if (typeof item === "string" && item === nodeId) {
        return {
          type: "serial",
          topIndex: i,
          parallelIndex: null,
          pathIndex: null,
          nodeIndexInPath: null,
        };
      }

      if (Array.isArray(item)) {
        for (let p = 0; p < item.length; p++) {
          const path = item[p];
          const nodeIndex = path.indexOf(nodeId);
          if (nodeIndex !== -1) {
            return {
              type: "parallel",
              topIndex: i,
              parallelIndex: p,
              pathIndex: p,
              nodeIndexInPath: nodeIndex,
            };
          }
        }
      }
    }
    return null;
  }

  getNodePosition(nodeId: string) {
    const position = this.findNode(nodeId);
    if (!position) return null;
    return {
      stepIndex: position.topIndex,
      pathIndex: position.pathIndex,
      nodeIndex: position.nodeIndexInPath,
    };
  }

  getStepIndex(nodeId: string) {
    return this.findNode(nodeId)?.topIndex ?? -1;
  }

  getNodeIds(): string[] {
    const nodeIds: string[] = [];
    for (const item of this.data) {
      if (Array.isArray(item)) item.forEach((path) => nodeIds.push(...path));
      else nodeIds.push(item);
    }
    return nodeIds;
  }

  getPathNodeIds(nodeId: string): string[] {
    const position = this.findNode(nodeId);
    if (!position) return [];
    if (position.type === "serial") return [nodeId];
    return (this.data[position.topIndex][position.pathIndex!] as string[]).slice();
  }

  isInParallelGroup(nodeId: string): boolean {
    return this.findNode(nodeId)?.type === "parallel";
  }

  /** 在指定顶层索引后添加节点（串行） */
  addAfterIndex(topIndex: number, ...newNodes: string[]): string[] {
    if (!this._isValidTopIndex("addAfterIndex", topIndex)) return [];
    const addedNodes = this._collectValidNewNodes("addAfterIndex", newNodes);
    if (addedNodes.length === 0) return [];
    this.data.splice(topIndex + 1, 0, ...addedNodes);
    return addedNodes;
  }

  /** 在指定顶层索引前添加节点（串行） */
  addBeforeIndex(topIndex: number, ...newNodes: string[]): string[] {
    if (!this._isValidTopIndex("addBeforeIndex", topIndex)) return [];
    const addedNodes = this._collectValidNewNodes("addBeforeIndex", newNodes);
    if (addedNodes.length === 0) return [];
    this.data.splice(topIndex, 0, ...addedNodes);
    return addedNodes;
  }

  /** 添加节点（串行） */
  addAfter(targetId: string, ...newNodes: string[]): string[] {
    const pos = this.findNode(targetId);
    if (!pos) return [];

    const addedNodes = this._collectValidNewNodes("addAfter", newNodes);
    if (addedNodes.length === 0) return [];

    if (pos.type === "serial") {
      this.data.splice(pos.topIndex + 1, 0, ...addedNodes);
    } else {
      const parallelGroup = this.data[pos.topIndex] as ParallelGroup;
      const targetPath = parallelGroup[pos.pathIndex!];
      targetPath.splice(pos.nodeIndexInPath! + 1, 0, ...addedNodes);
    }
    return addedNodes;
  }

  addBefore(targetId: string, ...newNodes: string[]): string[] {
    const pos = this.findNode(targetId);
    if (!pos) return [];

    const addedNodes = this._collectValidNewNodes("addBefore", newNodes);
    if (addedNodes.length === 0) return [];

    if (pos.type === "serial") {
      this.data.splice(pos.topIndex, 0, ...addedNodes);
    } else {
      const parallelGroup = this.data[pos.topIndex] as ParallelGroup;
      const targetPath = parallelGroup[pos.pathIndex!];
      targetPath.splice(pos.nodeIndexInPath!, 0, ...addedNodes);
    }
    return addedNodes;
  }

  /** 在目标节点所属的顶层步骤前插入步骤 */
  addStepsBefore(targetId: string, ...newSteps: FlowStep[]): string[] {
    return this._insertSteps(targetId, newSteps, "before");
  }

  /** 在目标节点所属的顶层步骤后插入步骤 */
  addStepsAfter(targetId: string, ...newSteps: FlowStep[]): string[] {
    return this._insertSteps(targetId, newSteps, "after");
  }

  /** 删除节点 */
  remove(nodeId: string): this {
    const pos = this.findNode(nodeId);
    if (!pos) return this;

    if (pos.type === "serial") {
      this.data.splice(pos.topIndex, 1);
    } else {
      const parallelGroup = this.data[pos.topIndex] as ParallelGroup;
      const targetPath = parallelGroup[pos.pathIndex!];
      targetPath.splice(pos.nodeIndexInPath!, 1);

      if (targetPath.length === 0) {
        parallelGroup.splice(pos.pathIndex!, 1);
      }

      this._collapseParallelGroup(pos.topIndex);
    }
    return this;
  }

  removeNodes(...nodeIds: Array<string | string[]>): string[] {
    const ids =
      nodeIds.length === 1 && Array.isArray(nodeIds[0]) ? nodeIds[0] : (nodeIds as string[]);
    const removedNodeIds: string[] = [];
    for (const nodeId of ids) {
      if (!this.hasNode(nodeId)) continue;
      this.remove(nodeId);
      removedNodeIds.push(nodeId);
    }
    return removedNodeIds;
  }

  /** 检查节点是否已存在 */
  hasNode(nodeId: string): boolean {
    return this.findNode(nodeId) !== null;
  }

  /**
   * 为种子节点生成不冲突的副本 ID（seed-2, seed-3 ...）。返回源→副本映射。
   */
  duplicateNodeIds(seeds: string[]): { from: string; to: string }[] {
    const used = new Set(this.getNodeIds());
    const pairs: { from: string; to: string }[] = [];
    for (const seed of seeds) {
      if (!this.hasNode(seed)) continue;
      let n = 2;
      let candidate = `${seed}-${n}`;
      while (used.has(candidate)) {
        n += 1;
        candidate = `${seed}-${n}`;
      }
      used.add(candidate);
      pairs.push({ from: seed, to: candidate });
    }
    return pairs;
  }

  /**
   * 复制选定节点为独立步骤片段（保留路径结构，路径为原子单元：path 中任一节点被选即整体复制）。
   */
  cloneToClipboard(nodeIds: string[]): FlowClipboard | null {
    const selected = new Set(nodeIds);
    const steps: FlowStep[] = [];
    for (const item of this.data) {
      if (typeof item === "string") {
        if (selected.has(item)) steps.push(item);
        continue;
      }
      const copiedPaths: string[][] = [];
      for (const path of item) {
        if (path.some((id) => selected.has(id))) {
          copiedPaths.push([...path]);
        }
      }
      if (copiedPaths.length === 1) steps.push(...copiedPaths[0]);
      else if (copiedPaths.length > 1) steps.push(copiedPaths);
    }
    if (steps.length === 0) return null;
    return { steps };
  }

  /**
   * 将剪贴板片段粘贴到目标步骤之后（anchorId 为 null 时追加到尾部）。
   * 副本使用不冲突的新 ID；粘贴后返回 源→副本 映射。
   */
  paste(
    clipboard: FlowClipboard,
    anchorId?: string | null,
  ): { flow: FlowModel; pairs: { from: string; to: string }[] } {
    const seeds: string[] = [];
    const collect = (step: FlowStep) => {
      if (Array.isArray(step)) seeds.push(...step.flat());
      else seeds.push(step);
    };
    for (const step of clipboard.steps) collect(step);

    const pairs = this.duplicateNodeIds(seeds);
    const idMap = new Map(pairs.map((p) => [p.from, p.to]));

    const steps = clipboard.steps.flatMap((step): FlowStep[] => {
      if (typeof step === "string") return [idMap.get(step)!];
      const group: ParallelGroup = [];
      for (const path of step) {
        group.push(path.map((id) => idMap.get(id)!));
      }
      return group.length === 1 ? (group[0] as FlowStep[]) : [group as FlowStep];
    });

    const anchor = anchorId ? this.findNode(anchorId) : null;
    const insertionIndex = anchor ? anchor.topIndex + 1 : this.data.length;
    this.data.splice(insertionIndex, 0, ...steps);
    return { flow: this.getData(), pairs };
  }

  /**
   * 原地复制选定节点到其源步骤之后，返回 源→副本 映射。
   */
  duplicateNodes(nodeIds: string[]): { from: string; to: string }[] {
    const clipboard = this.cloneToClipboard(nodeIds);
    if (!clipboard) return [];
    const maxIndex =
      nodeIds.length > 0 ? Math.max(...nodeIds.map((id) => this.findNode(id)?.topIndex ?? -1)) : -1;
    const anchorStep = maxIndex >= 0 ? this.data[maxIndex] : null;
    const anchor =
      typeof anchorStep === "string"
        ? anchorStep
        : Array.isArray(anchorStep) && anchorStep.length > 0
          ? anchorStep[0][0]
          : null;
    return this.paste(clipboard, anchor).pairs;
  }

  /** 检查节点是否在主干分支上 */
  inMainBranch(nodeId: string): boolean {
    return this.hasNode(nodeId) && !this.isInParallelGroup(nodeId);
  }

  /** 校验节点 ID，返回是否校验通过 */
  _validateNodeId(nodeId: string): { valid: boolean; error?: string } {
    if (nodeId === null || nodeId === undefined || nodeId === "") {
      return { valid: false, error: "节点ID不能为空" };
    }
    if (typeof nodeId !== "string") {
      return { valid: false, error: `节点ID必须是字符串，实际为 ${typeof nodeId}` };
    }
    if (this.hasNode(nodeId)) {
      return { valid: false, error: `节点ID "${nodeId}" 已存在` };
    }
    return { valid: true };
  }

  /** 校验顶层索引，返回是否校验通过 */
  _isValidTopIndex(methodName: string, topIndex: number): boolean {
    if (typeof topIndex !== "number" || !Number.isInteger(topIndex)) {
      console.warn(`Flow.${methodName}: 索引必须是整数，实际为 ${typeof topIndex}`);
      return false;
    }
    if (topIndex < 0 || topIndex >= this.data.length) {
      console.warn(`Flow.${methodName}: 索引 ${topIndex} 超出范围 [0, ${this.data.length - 1}]`);
      return false;
    }
    return true;
  }

  /** 往首部增加节点（串行） */
  unshift(...newNodes: string[]): string[] {
    const addedNodes = this._collectValidNewNodes("unshift", newNodes);
    if (addedNodes.length === 0) return [];
    this.data.unshift(...addedNodes);
    return addedNodes;
  }

  /** 往首部增加节点组（并行组） */
  unshiftParallel(nodes: Array<FlowPath | string>): string[] {
    if (!Array.isArray(nodes)) {
      console.warn("Flow.unshiftParallel: 参数必须是数组");
      return [];
    }

    const { parallelGroup, addedNodes } = this._collectValidParallelGroup("unshiftParallel", nodes);
    if (parallelGroup.length === 0) return [];

    if (parallelGroup.length === 1) {
      this.data.unshift(...parallelGroup[0]);
    } else {
      this.data.unshift(parallelGroup);
    }
    return addedNodes;
  }

  /** 往尾部增加节点（串行） */
  push(...newNodes: string[]): string[] {
    const addedNodes = this._collectValidNewNodes("push", newNodes);
    if (addedNodes.length === 0) return [];
    this.data.push(...addedNodes);
    return addedNodes;
  }

  /** 往尾部增加节点组（并行组） */
  pushParallel(nodes: Array<FlowPath | string>): string[] {
    if (!Array.isArray(nodes)) {
      console.warn("Flow.pushParallel: 参数必须是数组");
      return [];
    }

    const { parallelGroup, addedNodes } = this._collectValidParallelGroup("pushParallel", nodes);
    if (parallelGroup.length === 0) return [];

    if (parallelGroup.length === 1) {
      this.data.push(...parallelGroup[0]);
    } else {
      this.data.push(parallelGroup);
    }
    return addedNodes;
  }

  prependSteps(...newSteps: FlowStep[]): string[] {
    const { steps, addedNodes } = this._collectValidSteps("prependSteps", newSteps);
    if (steps.length === 0) return [];
    this.data.unshift(...steps);
    return addedNodes;
  }

  appendSteps(...newSteps: FlowStep[]): string[] {
    const { steps, addedNodes } = this._collectValidSteps("appendSteps", newSteps);
    if (steps.length === 0) return [];
    this.data.push(...steps);
    return addedNodes;
  }

  /** 在指定节点所在路径前添加并行路径 */
  addParallelBefore(targetId: string, ...newNodes: Array<FlowPath | string>): string[] {
    return this._insertParallel(targetId, newNodes, "before");
  }

  /** 在指定节点所在路径后添加并行路径 */
  addParallelAfter(targetId: string, ...newNodes: Array<FlowPath | string>): string[] {
    return this._insertParallel(targetId, newNodes, "after");
  }

  _insertParallel(
    targetId: string,
    newNodes: Array<FlowPath | string>,
    position: "before" | "after",
  ): string[] {
    const pos = this.findNode(targetId);
    if (!pos) return [];

    const methodName = position === "before" ? "addParallelBefore" : "addParallelAfter";
    const { parallelGroup: newPaths, addedNodes } = this._collectValidParallelGroup(
      methodName,
      newNodes,
    );
    if (newPaths.length === 0) return [];

    if (pos.type === "serial") {
      const targetPath = [targetId];
      const newParallelGroup =
        position === "before" ? [...newPaths, targetPath] : [targetPath, ...newPaths];
      this.data.splice(pos.topIndex, 1, newParallelGroup);
    } else {
      const parallelGroup = this.data[pos.topIndex] as ParallelGroup;
      const insertionIndex = position === "before" ? pos.pathIndex! : pos.pathIndex! + 1;
      parallelGroup.splice(insertionIndex, 0, ...newPaths);
    }
    return addedNodes;
  }

  _insertSteps(targetId: string, newSteps: FlowStep[], position: "before" | "after"): string[] {
    const targetPosition = this.findNode(targetId);
    if (!targetPosition) return [];

    const methodName = position === "before" ? "addStepsBefore" : "addStepsAfter";
    const { steps, addedNodes } = this._collectValidSteps(methodName, newSteps);
    if (steps.length === 0) return [];

    const insertionIndex =
      position === "before" ? targetPosition.topIndex : targetPosition.topIndex + 1;
    this.data.splice(insertionIndex, 0, ...steps);
    return addedNodes;
  }

  /** 收缩并行组（当只剩 1 条或 0 条路径时） */
  _collapseParallelGroup(topIndex: number) {
    const group = this.data[topIndex];
    if (!Array.isArray(group)) return;

    if (group.length === 0) {
      this.data.splice(topIndex, 1);
    } else if (group.length === 1) {
      this.data.splice(topIndex, 1, ...group[0]);
    }
  }

  /** 内部：递归计算节点总数 */
  _countNodes(data: FlowStep[]): number {
    let count = 0;
    for (const item of data) {
      if (typeof item === "string") {
        count++;
      } else if (Array.isArray(item)) {
        for (const path of item) {
          count += path.length;
        }
      }
    }
    return count;
  }

  /** 获取当前数据（只读副本） */
  getData(): FlowModel {
    return JSON.parse(JSON.stringify(this.data));
  }

  _collectValidNewNodes(methodName: string, newNodes: string[]): string[] {
    const addedNodes: string[] = [];
    const batchSet = new Set<string>();
    for (const nodeId of newNodes) {
      if (batchSet.has(nodeId)) {
        console.warn(`Flow.${methodName}: 节点ID "${nodeId}" 在本次操作中重复`);
        continue;
      }
      const result = this._validateNodeId(nodeId);
      if (!result.valid) {
        console.warn(`Flow.${methodName}: ${result.error}`);
        continue;
      }
      batchSet.add(nodeId);
      addedNodes.push(nodeId);
    }
    return addedNodes;
  }

  _collectValidParallelGroup(
    methodName: string,
    nodes: Array<FlowPath | string>,
  ): {
    parallelGroup: ParallelGroup;
    addedNodes: string[];
  } {
    const parallelGroup: ParallelGroup = [];
    const addedNodes: string[] = [];
    const batchSet = new Set<string>();

    for (const path of nodes) {
      const pathArray = Array.isArray(path) ? path : [path];
      const newPath: string[] = [];

      for (const nodeId of pathArray) {
        if (batchSet.has(nodeId)) {
          console.warn(`Flow.${methodName}: 节点ID "${nodeId}" 在本次操作中重复`);
          continue;
        }

        const result = this._validateNodeId(nodeId);
        if (!result.valid) {
          console.warn(`Flow.${methodName}: ${result.error}`);
          continue;
        }

        batchSet.add(nodeId);
        newPath.push(nodeId);
        addedNodes.push(nodeId);
      }

      if (newPath.length > 0) {
        parallelGroup.push(newPath);
      }
    }

    return { parallelGroup, addedNodes };
  }

  _collectValidSteps(
    methodName: string,
    newSteps: FlowStep[],
  ): {
    steps: FlowStep[];
    addedNodes: string[];
  } {
    const steps: FlowStep[] = [];
    const addedNodes: string[] = [];
    const batchSet = new Set<string>();

    for (const step of newSteps) {
      if (!Array.isArray(step)) {
        if (batchSet.has(step)) {
          console.warn(`Flow.${methodName}: 节点ID "${step}" 在本次操作中重复`);
          continue;
        }
        const result = this._validateNodeId(step);
        if (!result.valid) {
          console.warn(`Flow.${methodName}: ${result.error}`);
          continue;
        }
        batchSet.add(step);
        steps.push(step);
        addedNodes.push(step);
        continue;
      }

      const parallelGroup: ParallelGroup = [];
      for (const path of step) {
        const pathArray = Array.isArray(path) ? path : [path];
        const newPath: string[] = [];
        for (const nodeId of pathArray) {
          if (batchSet.has(nodeId)) {
            console.warn(`Flow.${methodName}: 节点ID "${nodeId}" 在本次操作中重复`);
            continue;
          }
          const result = this._validateNodeId(nodeId);
          if (!result.valid) {
            console.warn(`Flow.${methodName}: ${result.error}`);
            continue;
          }
          batchSet.add(nodeId);
          newPath.push(nodeId);
          addedNodes.push(nodeId);
        }
        if (newPath.length > 0) parallelGroup.push(newPath);
      }
      if (parallelGroup.length === 1) steps.push(...parallelGroup[0]);
      else if (parallelGroup.length > 1) steps.push(parallelGroup);
    }

    return { steps, addedNodes };
  }

  /** 打印调试 */
  toString(): string {
    return JSON.stringify(this.data);
  }
}
