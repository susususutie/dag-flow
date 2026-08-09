import { useState } from "react";
import type { ReactNode } from "react";
import BasicDemo from "./demos/BasicDemo.tsx";
import BasicParallelDemo from "./demos/BasicParallelDemo.tsx";
import UncontrolledDemo from "./demos/UncontrolledDemo.tsx";
import ControlledDemo from "./demos/ControlledDemo.tsx";
import FitViewDemo from "./demos/FitViewDemo.tsx";
import ViewportDemo from "./demos/ViewportDemo.tsx";
import ZoomLimitDemo from "./demos/ZoomLimitDemo.tsx";
import ViewControlDemo from "./demos/ViewControlDemo.tsx";
import InteractionDemo from "./demos/InteractionDemo.tsx";
import SelectableDemo from "./demos/SelectableDemo.tsx";
import DeleteGuardDemo from "./demos/DeleteGuardDemo.tsx";
import PanZoomConfigDemo from "./demos/PanZoomConfigDemo.tsx";
import GapDemo from "./demos/GapDemo.tsx";
import LineStyleDemo from "./demos/LineStyleDemo.tsx";
import CustomLayoutDemo from "./demos/CustomLayoutDemo.tsx";
import ForceLayoutDemo from "./demos/ForceLayoutDemo.tsx";
import KeyboardDemo from "./demos/KeyboardDemo.tsx";
import CustomNodesDemo from "./demos/CustomNodesDemo.tsx";
import NodeEditorDemo from "./demos/NodeEditorDemo.tsx";
import ProviderDemo from "./demos/ProviderDemo.tsx";
import ProviderUncontrolledDemo from "./demos/ProviderUncontrolledDemo.tsx";
import ControlsDemo from "./demos/ControlsDemo.tsx";
import MiniMapDemo from "./demos/MiniMapDemo.tsx";
import BackgroundDemo from "./demos/BackgroundDemo.tsx";

export interface SceneEntry {
  render: ReactNode;
}

const SCENES: Array<{
  group: string;
  items: Array<{ key: string; label: string; render: ReactNode }>;
}> = [
  {
    group: "基础",
    items: [
      { key: "basic", label: "基础画布", render: <BasicDemo /> },
      { key: "basic-parallel", label: "并行拓扑", render: <BasicParallelDemo /> },
      { key: "uncontrolled", label: "非受控模式", render: <UncontrolledDemo /> },
      { key: "controlled", label: "受控模式", render: <ControlledDemo /> },
    ],
  },
  {
    group: "视口",
    items: [
      { key: "fit-view", label: "fitView / fitViewOptions", render: <FitViewDemo /> },
      { key: "viewport", label: "defaultViewport / onMove", render: <ViewportDemo /> },
      { key: "zoom-limit", label: "minZoom / maxZoom", render: <ZoomLimitDemo /> },
      { key: "view-control", label: "视口实例 API", render: <ViewControlDemo /> },
    ],
  },
  {
    group: "交互",
    items: [
      { key: "interaction", label: "交互事件回调", render: <InteractionDemo /> },
      { key: "selectable", label: "节点选择与拖动", render: <SelectableDemo /> },
      { key: "delete-guard", label: "onBeforeDelete", render: <DeleteGuardDemo /> },
      { key: "pan-zoom-config", label: "缩放平移配置", render: <PanZoomConfigDemo /> },
      { key: "keyboard", label: "快捷键 复制/粘贴/撤销", render: <KeyboardDemo /> },
    ],
  },
  {
    group: "布局与样式",
    items: [
      { key: "gap", label: "布局算法间距", render: <GapDemo /> },
      { key: "line-style", label: "Edge CSS variables", render: <LineStyleDemo /> },
      { key: "custom-layout", label: "自定义布局引擎", render: <CustomLayoutDemo /> },
      { key: "force-layout", label: "显式 layout()", render: <ForceLayoutDemo /> },
    ],
  },
  {
    group: "节点",
    items: [
      { key: "custom-nodes", label: "自定义节点", render: <CustomNodesDemo /> },
      { key: "node-editor", label: "节点增删改建模", render: <NodeEditorDemo /> },
    ],
  },
  {
    group: "组织架构",
    items: [
      { key: "provider", label: "DagFlowProvider 受控", render: <ProviderDemo /> },
      {
        key: "provider-uncontrolled",
        label: "DagFlowProvider 非受控",
        render: <ProviderUncontrolledDemo />,
      },
    ],
  },
  {
    group: "附加组件",
    items: [
      { key: "controls", label: "Controls", render: <ControlsDemo /> },
      { key: "minimap", label: "MiniMap", render: <MiniMapDemo /> },
      { key: "background", label: "Background", render: <BackgroundDemo /> },
    ],
  },
];

const FLAT_SCENES = SCENES.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.group })),
);

export default function App() {
  const [active, setActive] = useState(FLAT_SCENES[0].key);
  const current = FLAT_SCENES.find((demo) => demo.key === active) ?? FLAT_SCENES[0];

  return (
    <div className="demo-app">
      <header className="demo-header">
        <div className="demo-title">
          <span className="demo-logo">DAG</span>
          <h1>DAG Flow Playground</h1>
        </div>
      </header>
      <div className="demo-layout">
        <nav className="demo-sidebar">
          {SCENES.map((group) => (
            <div key={group.group} className="demo-sidebar-group">
              <div className="demo-sidebar-title">{group.group}</div>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  className={
                    item.key === active
                      ? "demo-sidebar-item demo-sidebar-item--active"
                      : "demo-sidebar-item"
                  }
                  onClick={() => setActive(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <main className="demo-body">
          <div className="demo-body-scene">{current.render}</div>
        </main>
      </div>
    </div>
  );
}
