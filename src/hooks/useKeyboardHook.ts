import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import useCanvasState from "./useCanvasState.ts";
import useCanvasDispatch from "./useCanvasDispatch.ts";
import useDAGInstance from "./useDAGInstance.ts";
import Flow, { type FlowClipboard } from "../utils/Flow.ts";
import type { DAGNode, FlowModel } from "../types/index.ts";
/** 模块级剪贴板（跨 DagFlow 实例共享，含嵌套结构） */
let dagClipboard: FlowClipboard | null = null;

export interface KeyboardHookOptions {
  /** 删除/复制/粘贴/撤销快捷键开关，默认开启 */
  enabled?: boolean;
  /** 快捷键生效的画布元素 */
  target?: RefObject<HTMLElement | null>;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'),
  );
}

/**
 * 画布快捷键 hook：
 * - Delete / Backspace：删除选中节点
 * - Cmd/Ctrl+D：复制选中节点（保留路径结构）
 * - Cmd/Ctrl+C / Cmd/Ctrl+V：复制 / 粘贴（粘贴到当前选中节点之后，无选中时追加尾部）
 * - Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z：撤销 / 重做
 * 输入框/文本域中不触发。
 */
export default function useKeyboardHook(options: KeyboardHookOptions = {}) {
  const { enabled = true, target } = options;
  const instance = useDAGInstance();
  const dispatch = useCanvasDispatch();
  const { selectedNodes } = useCanvasState();
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const copySelection = useCallback((): FlowClipboard | null => {
    const flow = instance.getFlow();
    const ids = Array.from(selectedNodes);
    if (ids.length === 0) return null;
    const clip = new Flow(flow).cloneToClipboard(ids);
    if (clip) dagClipboard = clip;
    return clip;
  }, [instance, selectedNodes]);

  const pasteClipboard = useCallback(() => {
    if (!dagClipboard) return;
    const flowInstance = new Flow(instance.getFlow());
    const anchor = selectedNodes.size > 0 ? Array.from(selectedNodes)[0] : null;
    const { flow: nextFlow, pairs } = flowInstance.paste(dagClipboard, anchor);
    const { nodes } = instance.getDAG();
    const existing = new Set(instance.getNodes().map((n) => n.id));
    const sources = new Map(instance.getNodes().map((n) => [n.id, n]));
    const pasteToSource = new Map(pairs.map((p) => [p.to, p.from]));

    const added: string[] = [];
    for (const item of nextFlow as FlowModel) {
      const ids = typeof item === "string" ? [item] : item.flat();
      for (const id of ids) if (!existing.has(id)) added.push(id);
    }
    const newNodes = added.map((id) => {
      const source = sources.get(pasteToSource.get(id) ?? "");
      return {
        id,
        type: source?.type,
        data: source?.data ?? {},
        position: { x: 0, y: 0 },
      } as DAGNode;
    });
    instance.setDAG({ flow: nextFlow, nodes: [...nodes, ...newNodes] });
  }, [instance, selectedNodes]);

  const duplicateSelection = useCallback(() => {
    const ids = Array.from(selectedNodes);
    if (ids.length === 0) return;
    const flowInstance = new Flow(instance.getFlow());
    const pairs = flowInstance.duplicateNodes(ids);
    if (pairs.length === 0) return;
    const { nodes } = instance.getDAG();
    const sources = new Map(instance.getNodes().map((n) => [n.id, n]));
    const newNodes = pairs.map(({ from, to }) => {
      const source = sources.get(from);
      return {
        id: to,
        type: source?.type,
        data: source?.data ?? {},
        position: { x: 0, y: 0 },
        selected: true,
      } as DAGNode;
    });
    instance.setDAG({ flow: flowInstance.toArray(), nodes: [...nodes, ...newNodes] });
  }, [instance, selectedNodes]);

  const deleteSelection = useCallback(() => {
    const ids = Array.from(selectedNodes);
    if (ids.length === 0) return;
    void instance.deleteNodes(ids);
  }, [instance, selectedNodes]);

  useEffect(() => {
    if (!enabledRef.current) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const mod = event.metaKey || event.ctrlKey;

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelection();
        return;
      }
      if (mod && (event.key === "d" || event.key === "D")) {
        event.preventDefault();
        duplicateSelection();
        return;
      }
      if (mod && (event.key === "c" || event.key === "C")) {
        event.preventDefault();
        copySelection();
        return;
      }
      if (mod && (event.key === "v" || event.key === "V")) {
        event.preventDefault();
        pasteClipboard();
        return;
      }
      if (mod && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) dispatch({ type: "REDO" });
        else dispatch({ type: "UNDO" });
        return;
      }
      if (mod && event.shiftKey && (event.key === "Z" || event.key === "z")) {
        event.preventDefault();
        dispatch({ type: "REDO" });
      }
    };

    const element = target?.current;
    if (!element) return;
    element.addEventListener("keydown", onKeyDown);
    return () => element.removeEventListener("keydown", onKeyDown);
  }, [deleteSelection, duplicateSelection, copySelection, pasteClipboard, dispatch, target]);
}
