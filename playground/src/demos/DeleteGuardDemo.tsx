import { useCallback, useState } from "react";
import { DAGCanvas } from "dag-flow";
import type { DAGNode, OnBeforeDeleteResult } from "dag-flow";
import { BASIC_FLOW, BASIC_NODES, nodeTypes } from "./shared.tsx";

type GuardMode = "allow" | "block" | "filter";

const MODE_TEXT: Record<GuardMode, string> = {
  allow: "返回 true：允许全部删除",
  block: "返回 false：阻止删除",
  filter: "返回 { nodes }：只删除指定子集",
};

/** onBeforeDelete：删除前拦截，支持 true / false / { nodes } 三种返回 */
export default function DeleteGuardDemo() {
  const [mode, setMode] = useState<GuardMode>("allow");
  const [logs, setLogs] = useState<string[]>([]);

  const record = useCallback((message: string) => {
    setLogs((prev) => [message, ...prev].slice(0, 8));
  }, []);

  const onBeforeDelete = useCallback(
    ({ nodes: requested }: { nodes: DAGNode[] }): OnBeforeDeleteResult => {
      record(`请求删除: ${requested.map((node) => node.id).join(",")}`);
      if (mode === "allow") return true;
      if (mode === "block") return false;
      const keep = "exec";
      const filtered = requested.filter((node) => node.id !== keep);
      record(`过滤保留: ${keep}`);
      return { nodes: filtered };
    },
    [mode, record],
  );

  return (
    <div className="demo-scene">
      <div className="demo-controls">
        {(["allow", "block", "filter"] as GuardMode[]).map((item) => (
          <button
            key={item}
            className={mode === item ? "demo-chip demo-chip--active" : "demo-chip"}
            onClick={() => setMode(item)}
          >
            {MODE_TEXT[item]}
          </button>
        ))}
      </div>
      <div className="demo-controlled" style={{ flex: 1, minHeight: 0 }}>
        <div className="demo-canvas">
          <DAGCanvas
            defaultNodes={BASIC_NODES}
            defaultFlow={BASIC_FLOW}
            nodeTypes={nodeTypes}
            onBeforeDelete={onBeforeDelete}
            fitView
            fitViewOptions={{ padding: 40 }}
          />
        </div>
        <aside className="demo-panel">
          <h3>删除日志</h3>
          <ul className="demo-log">
            {logs.map((log, index) => (
              <li key={`${index}-${log}`}>{log}</li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
