import { useContext } from "react";
import type { ReactNode } from "react";
import { CanvasInstanceContext } from "../../contexts/StoreContext.tsx";
import CanvasProvider from "../../store/CanvasProvider.tsx";
import type { CanvasProviderProps } from "../../types/index.ts";

interface WrapperProps extends CanvasProviderProps {
  children?: ReactNode;
}

/**
 * 复用外层 DagFlowProvider 的 store；缺少外层 store 时创建内部 store。
 */
export default function Wrapper(props: WrapperProps) {
  const instance = useContext(CanvasInstanceContext);

  if (instance) return <>{props.children}</>;
  return <CanvasProvider {...props}>{props.children}</CanvasProvider>;
}
