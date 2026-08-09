import { useEffect, useState } from "react";
import type { RefObject } from "react";

export interface Size {
  width: number;
  height: number;
}

/**
 * 监听元素尺寸变化（ahooks useSize 的轻量替代）。
 * 支持 DOM 元素、RefObject 或返回元素的函数。
 */
export default function useSize<T extends HTMLElement>(
  target: T | RefObject<T | null> | (() => T | null | undefined) | undefined | null,
): Size | undefined {
  const [size, setSize] = useState<Size | undefined>(undefined);

  useEffect(() => {
    setSize(undefined);
    const el =
      typeof target === "function"
        ? target()
        : target && "current" in target
          ? target.current
          : target;
    if (!el) return;
    let active = true;

    const measure = () => {
      if (!active) return;
      const rect = el.getBoundingClientRect();
      setSize((size) => {
        if (size?.width === rect.width && size?.height === rect.height) return size;
        return { width: rect.width, height: rect.height };
      });
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [target]);

  return size;
}
