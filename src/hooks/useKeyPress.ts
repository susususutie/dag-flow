import { useEffect, useRef } from "react";

interface UseKeyPressOptions {
  /** 监听的原生事件名，默认 ['keydown', 'keyup'] */
  events?: Array<"keydown" | "keyup">;
  /** 输入框/文本区域等可编辑目标中按下修饰键时不触发，默认 true */
  exclude?: boolean;
}

export type KeyHandler = (event: KeyboardEvent, key: string) => void;

/**
 * 按键监听 hook（ahooks useKeyPress 的轻量替代，仅支持修饰键 meta/ctrl）。
 * 用于画布平移拖拽时同步 Ctrl/Meta 修饰键的按住状态。
 */
export default function useKeyPress(
  keys: string | string[],
  handler: KeyHandler,
  options: UseKeyPressOptions = {},
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const { events = ["keydown", "keyup"], exclude = true } = options;
    const targetKeys = (Array.isArray(keys) ? keys : [keys]).map((key) => key.toLowerCase());

    const onKeyEvent = (event: KeyboardEvent) => {
      if (exclude && event.target instanceof HTMLElement) {
        const tagName = event.target.tagName;
        if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return;
      }
      const matched = targetKeys.find((key) =>
        key === "meta" ? event.metaKey : key === "ctrl" ? event.ctrlKey : false,
      );
      if (!matched) return;
      handlerRef.current?.(event, matched);
    };

    events.forEach((eventName) => window.addEventListener(eventName, onKeyEvent));
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, onKeyEvent));
    };
  }, [keys, options]);
}
