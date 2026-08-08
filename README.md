# dag-flow

`dag-flow` 是一个基于 React 的交互式 DAG 画布组件库。节点用 `nodes` 描述，串行与并行拓扑用嵌套的 `flow` 表达，布局与连线自动完成；同时提供自定义节点、受控与非受控状态、节点选择与删除、画布平移缩放、视图适配、缩略图及工具栏等能力。适用于拓扑结构由流程顺序确定的编排、展示和编辑场景。

## 快速开始

```tsx
import { DAGCanvas } from "dag-flow";
import "dag-flow/style.css";

const nodes = [
  { id: "start", data: { label: "发起申请" } },
  { id: "approve", data: { label: "部门审批" } },
  { id: "exec", data: { label: "执行" } },
];

const flow = ["start", "approve", "exec"];

export default function App() {
  return <DAGCanvas nodes={nodes} flow={flow} fitView />;
}
```

## 拓扑模型

`flow` 为步骤数组，元素为节点 ID 或并行组：

- 节点 ID：串行步骤，如 `"approve"`
- 并行组：多路径数组，如 `[["approve-a"], ["approve-b1", "approve-b2"]]`

示例：入口节点分三条路径并行执行（其中一条路径含两个串行节点），随后汇聚到汇合节点：

```ts
const flow = ["start", [["approve-a"], ["approve-b1", "approve-b2"], ["check"]], "exec"];
```

节点通过 `nodeMap` 渲染对应组件，连线由画布基于节点测量坐标自动生成，无需手动描述边。

## 使用方式

`DAGCanvas` 支持两种数据模式：

- 受控：`nodes`、`flow` 及 `onNodesChange`、`onFlowChange` 由外部持有，此时可使用 useDAGState 辅助管理状态
- 非受控：内部维护 `nodes` 与 `flow`，通过回调接收变更，可通过包裹 `DAGProvider` 使用 hooks 获取内部状态

```tsx
import { useState } from "react";
import { DAGCanvas, useDAGState } from "dag-flow";

function App() {
  const { nodes, flow, onNodesChange, onFlowChange } = useDAGState({ nodes: [], flow: [] });

  return (
    <DAGCanvas
      nodes={nodes}
      flow={flow}
      onNodesChange={onNodesChange}
      onFlowChange={onFlowChange}
    />
  );
}
```

```tsx
import { useState } from "react";
import { DAGCanvas, DAGProvider } from "dag-flow";

function UnControlled() {
  const viewport = useViewport();

  return (
    <>
      <DAGCanvas defaultNodes={[]} defaultFlow={[]} />
      <div>viewport: {JSON.stringify(viewport, null, 2)}</div>
    </>
  );
}

function App() {
  return (
    <DAGProvider>
      <UnControlled />
    </DAGProvider>
  );
}
```

## 能力清单

- 自定义节点：通过 `nodeTypes` 注册节点组件，`DAGCanvas` 统一处理选中与点击
- 实例 API：通过 `useDAGInstance` 获取，支持 `setDAG`、`setNodes`、`setFlow`、`updateNode`、`updateNodeData`、`deleteNode`、`deleteNodes`、`selectNode`、`clearSelection`、`fitView`、`zoomIn`、`zoomOut`、`zoomTo`、`setViewport`、`getViewport`、`layout`（强制全量重排，忽略已固定节点）
- 节点选择：单选、取消选中、删除前拦截（`onBeforeDelete`）
- 画布交互：滚轮缩放、拖拽平移、`panOnScroll` 与 `zoomModifier` 等修饰键配置
- 视图适配：`fitView` 初始适配与 `fitViewOptions`
- 事件回调：`onNodeClick`、`onPaneClick`、`onSelectionChange`、`onFlowChange`、`onMove`
- 布局配置：`layout.hGap`、`layout.vGap`、`layout.lineWidth`、`layout.lineColor`；`layout()` 强制重排（无视已拖动节点），布局结果通过 `onLayoutChange` 通知受控方
- 布局引擎：`layoutEngine` 可替换默认列式路由（`defaultLayoutEngine`），实现 `(flow, { dimensions, pinned, config }) => positions` 契约即可；此时 `hGap/vGap` 等参数由引擎自行决定是否消费
- 边线样式：由 `--dag-flow-line-color` / `--dag-flow-line-width` CSS 变量控制，可整体换肤
- 拓扑建模：`Flow` 类提供 `addAfter`、`addParallelAfter`、`addStepsBefore`、`remove` 等操作

## 附加组件

| 组件         | 说明                                                           |
| ------------ | -------------------------------------------------------------- |
| `Controls`   | 画布控制按钮：缩放、视图适配；`position` 四角停靠或 `"none"`   |
| `MiniMap`    | 缩略图，展示画布内容与当前视口；`position` 四角停靠或 `"none"` |
| `Background` | 画布背景网格                                                   |

多个附加组件同角落时，用普通 div 容器组合：`<Controls position="none" />` 与 `<MiniMap position="none" />` 交由外层容器（如 flex column）布局。

## Hooks

| Hook             | 说明                   |
| ---------------- | ---------------------- |
| `useDAGState`    | 受控模式状态读写       |
| `useDAGInstance` | 实例 API               |
| `useNodes`       | 当前节点列表           |
| `useFlow`        | 当前拓扑               |
| `useNode`        | 指定节点               |
| `useViewport`    | 视口状态（x、y、zoom） |

## 开发

```bash
vp install            # 安装依赖
vp run playground:dev # 启动示例（本地端口 5173）
vp check              # 格式、Lint 与类型检查
vp test               # 运行测试
vp pack               # 构建产物到 dist/
```
