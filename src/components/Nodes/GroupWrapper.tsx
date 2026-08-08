import { useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { LayoutContext } from "../../contexts/StoreContext.tsx";
import type { CSSProperties } from "react";

interface GroupWrapperProps {
  children: ReactNode;
  isEnd: boolean;
  rows: number;
}

/** 并行组外层包裹：grid 纵向排列各路径，路径间以 vGap 分隔 */
export default function GroupWrapper(props: GroupWrapperProps) {
  const { children, isEnd, rows } = props;
  const { hGap, vGap } = useContext(LayoutContext);

  const gapRows = Array.from({ length: rows - 1 }, () => [`${vGap}px`, "1fr"]).flat();
  const gridTemplateRows = ["1fr", ...gapRows].join(" ");

  const style = useMemo<CSSProperties>(
    () => ({
      marginRight: isEnd ? 0 : hGap,
      position: "relative",
      display: "flex",
      alignItems: "center",
    }),
    [isEnd, hGap],
  );

  return (
    <div className="dag-flow-group-wrapper" style={style}>
      <div className="dag-flow-group-node" style={{ gridTemplateRows }}>
        {children}
      </div>
    </div>
  );
}
