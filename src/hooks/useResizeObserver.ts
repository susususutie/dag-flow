import { useEffect, useRef } from "react";

type ObserverCallback = (entries: ResizeObserverEntry[]) => void;

const sharedObserver = new (class {
  observer: ResizeObserver | null = null;
  targets = new Map<Element, Set<ObserverCallback>>();

  ensure(): ResizeObserver | null {
    if (this.observer) return this.observer;
    if (typeof ResizeObserver === "undefined") return null;
    this.observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const callbacks = this.targets.get(entry.target);
        if (!callbacks) continue;
        for (const callback of callbacks) callback([entry]);
      }
    });
    return this.observer;
  }

  observe(target: Element, callback: ObserverCallback) {
    const observer = this.ensure();
    if (!observer) return;
    const callbacks = this.targets.get(target) ?? new Set();
    const isNew = callbacks.size === 0;
    callbacks.add(callback);
    this.targets.set(target, callbacks);
    if (isNew) observer.observe(target);
  }

  unobserve(target: Element, callback: ObserverCallback) {
    const callbacks = this.targets.get(target);
    if (!callbacks) return;
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      this.targets.delete(target);
      this.observer?.unobserve(target);
    }
  }
})();

/**
 * 共享 ResizeObserver（RF useNodeObserver 对齐）：多节点复用同一个 RO 实例，
 * 卸载时自动解除观察。不可用环境（SSR/老浏览器）安全降级为不观察。
 */
export function useResizeObserver(
  ref: React.RefObject<HTMLElement | null>,
  callback: (entry: ResizeObserverEntry) => void,
  enabled = true,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const handler: ObserverCallback = (entries) => {
      for (const entry of entries) callbackRef.current(entry);
    };
    sharedObserver.observe(element, handler);
    return () => sharedObserver.unobserve(element, handler);
  }, [ref, enabled]);
}

export default useResizeObserver;
