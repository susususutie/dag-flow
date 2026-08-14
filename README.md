# dag-flow

`dag-flow` 是一个基于 React 的交互式 DAG 画布组件库。节点用 `nodes` 描述，串行与并行拓扑用嵌套的 `flow` 表达；画布基于 `node.position` 渲染节点并自动生成连线，同时提供显式布局、自定义节点、状态管理、拖动与选择、平移缩放、视图适配、MiniMap 和 NodeToolbar。

## 快速开始

```tsx
import { DagFlow } from "dag-flow";
import "dag-flow/style.css";

const nodes = [
  { id: "start", position: { x: 0, y: 0 }, data: { label: "发起申请" } },
  { id: "approve", position: { x: 300, y: 0 }, data: { label: "部门审批" } },
  { id: "exec", position: { x: 600, y: 0 }, data: { label: "执行" } },
];

export default function App() {
  return <DagFlow nodes={nodes} flow={["start", "approve", "exec"]} fitView />;
}
```

## 数据模型

`flow` 的元素为节点 ID 或并行路径组：

```ts
const flow = ["start", [["approve-a"], ["approve-b1", "approve-b2"]], "exec"];
```

`node.position` 是节点渲染、边锚点、MiniMap、NodeToolbar 和 `fitView` 的共同坐标。公共输入可省略该字段，画布会补为 `{ x: 0, y: 0 }`；拖动和布局结果均更新同一个字段。

节点集合与嵌套 `flow` 共同描述一个 DAG。需要同时改变两者时，使用一次 `setDAG()` 原子更新，不提供独立的实例 `setNodes()` 或 `setFlow()`。

`nodes` 与 `flow` 的节点 ID 必须完全一致且不能重复。画布会在初始数据、受控同步和 `setDAG()` 时校验该约束，避免节点无法渲染或测量。

节点由单层 `.dag-flow__node` 容器渲染，并使用 `transform: translate(...)` 定位。未注册 `type` 时，默认节点只显示 `data.label`，不创建额外内容容器，也不提供默认视觉样式。

## 受控状态

```tsx
const { nodes, flow, setDAG, onNodesChange, onFlowChange } = useDAGState({
  nodes: initialNodes,
  flow: initialFlow,
});

return (
  <DagFlow nodes={nodes} flow={flow} onNodesChange={onNodesChange} onFlowChange={onFlowChange} />
);
```

`nodesDraggable` 提供画布级拖动默认值，默认 `true`；节点的 `draggable` 存在时覆盖全局值。拖动通过 `onNodesChange` 发出带 `dragging` 的 position change，`applyNodeChanges()` 可直接写回坐标。

`direction` 控制所有节点统一的 Handle 和边端点，默认值为 `horizontal`：

- `horizontal`：左侧 target、右侧 source；
- `vertical`：顶部 target、底部 source。

该配置不控制布局算法。布局方向由传入的 `layoutEngine` 自行配置。

## 非受控状态与 Hooks

非受控使用时，`DagFlow` 通过 `defaultNodes` 和 `defaultFlow` 管理内部数据。需要在画布的同级组件或其他外层后代中使用 `useNodesInitialized()`、`useDAGInstance()`、`useNodes()` 等 hooks 时，用 `DagFlowProvider` 包裹画布和这些组件：

```tsx
function StatusPanel() {
  const initialized = useNodesInitialized();
  const nodes = useNodes();
  return <span>{initialized ? `${nodes.length} 个节点已就绪` : "正在测量"}</span>;
}

function App() {
  return (
    <DagFlowProvider>
      <DagFlow defaultNodes={initialNodes} defaultFlow={initialFlow} />
      <StatusPanel />
    </DagFlowProvider>
  );
}
```

`DagFlow` 会复用外层 `DagFlowProvider` 的 store，不会创建第二份状态。hook 组件直接作为 `DagFlow` 的 `children` 时，本身已位于画布 Provider 内，无需再包一层 `DagFlowProvider`。

## 显式布局

布局算法只负责计算坐标。`layout()` 读取最新已提交的 DAG 和节点尺寸，返回包含完整坐标的 DAG 数据，不修改画布状态，也不触发 `onNodesChange`。

```tsx
const instance = useDAGInstance();
const initialized = useNodesInitialized();
const pendingFitNodes = useRef<DAGNode[] | null>(null);

useEffect(() => {
  if (!initialized) return;
  void instance.layout().then((nextDAG) => {
    pendingFitNodes.current = nextDAG.nodes;
    setDAG(nextDAG);
  });
}, [initialized, instance, setDAG]);

useEffect(() => {
  if (pendingFitNodes.current !== nodes) return;
  pendingFitNodes.current = null;
  instance.fitView();
}, [instance, nodes]);
```

初始数据已有有效坐标时，可以直接使用 `<DagFlow fitView />`。初始数据需要自动布局时，应在布局结果写回并提交后调用实例的 `fitView()`。

`layoutEngine` 是行为依赖，不进入 store。算法配置由工厂闭包持有：

```tsx
const engine = createDefaultLayoutEngine({ hGap: 160, vGap: 16 });
<DagFlow layoutEngine={engine} />;
```

默认布局把 `hGap` 解释为一段连线的长度。并行组会在节点前后分别保留分叉、汇合段；连续并行组之间还会保留一段主干。所有分支从同一点展开，并在最长路径之后汇合，较短路径会延伸到该汇合点。

自定义布局引擎接收 `{ nodes, flow, dimensions }`，返回 `{ positions }`，可同步或异步执行。

## NodeToolbar

NodeToolbar 可在自定义节点内部省略 `nodeId`，也可指定单个或多个节点：

```tsx
function CustomNode() {
  return (
    <>
      <NodeToolbar position={Position.Top} align="center" offset={10}>
        <button>编辑</button>
      </NodeToolbar>
      <div>节点内容</div>
    </>
  );
}
```

工具栏支持 `Top`、`Right`、`Bottom`、`Left` 四个方向，不随画布缩放；多个画布分别使用自身 renderer 作为 Portal 目标。

`OverlayPortal` 将附加内容挂载到画布覆盖层，内容不随画布平移和缩放；`ViewportPortal` 将内容挂载到画布坐标系，内容随画布平移和缩放：

```tsx
<ViewportPortal>
  <div style={{ position: "absolute", transform: "translate(100px, 100px)" }}>[100, 100]</div>
</ViewportPortal>
```

Portal 宿主不接收指针事件；需要交互的内容可自行设置 `pointerEvents: "auto"`。

连线颜色和宽度通过 `.dag-flow` CSS 变量定制：

```css
.dag-flow {
  --dag-flow-edge-stroke: #1677ff;
  --dag-flow-edge-stroke-width: 3;
}
```

## API 概览

- 实例：`getDAG`、`getNodes`、`getNode`、`getFlow`、`setDAG`、`updateNode`、`updateNodeData`、`deleteNode`、`deleteNodes`、`selectNode`、`clearSelection`、`fitView`、`zoomIn`、`zoomOut`、`zoomTo`、`setViewport`、`getViewport`、`layout`
- Hooks：`useDAGState`、`useDAGInstance`、`useNodesInitialized`、`useNodes`、`useFlow`、`useNodeId`、`useViewport`
- 附加组件：`Controls`、`MiniMap`、`Background`、`NodeToolbar`、`OverlayPortal`、`ViewportPortal`
- 拓扑工具：`Flow`、`applyNodeChanges`

## 开发

```bash
vp install
vp run playground#dev
vp check
vp test
vp pack
```
