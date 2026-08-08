export interface DomLineProps {
  /** 是否位于并行组路径之间的空隙行 */
  inSpace?: boolean;
  /** 垂直位置：首行的上方折线 / 末行的下方折线 / 中间行 */
  verticalPlace?: "top" | "bottom" | "center";
  /** 是否为并行组的首行（上方折线） */
  isVerticalFirst?: boolean;
  /** 是否为并行组的末行（下方折线） */
  isVerticalLast?: boolean;
  /** 水平方向：start 表示节点右侧、end 表示节点左侧 */
  horizontalPlace?: "start" | "end";
}

/**
 * 连线占位元素：仅承担布局宽度（hGap），保证节点间距；
 * 实际连线由 EdgeLayer（SVG）基于测量坐标绘制，本组件不再渲染任何图形。
 * 位置语义属性仅保留以维持调用处可读性。
 */
export default function DomLine(_props: DomLineProps) {
  return <div className="dag-flow-dom-line" />;
}
