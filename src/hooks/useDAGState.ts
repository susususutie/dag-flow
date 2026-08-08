import { useCallback, useState } from "react";
import applyNodeChanges from "../utils/changes.ts";
import type { DAGNode, FlowModel, NodeChanges } from "../types/index.ts";

interface DAGStateValue {
  nodes: DAGNode[];
  flow: FlowModel;
}

interface DAGStateActions {
  setNodes: (value: DAGNode[] | ((nodes: DAGNode[]) => DAGNode[])) => void;
  setFlow: (value: FlowModel | ((flow: FlowModel) => FlowModel)) => void;
  setDAG: (
    value: Partial<DAGStateValue> | ((dag: DAGStateValue) => Partial<DAGStateValue>),
  ) => void;
  onNodesChange: (changes: NodeChanges) => void;
  onFlowChange: (flow: FlowModel) => void;
}

export type UseDAGStateResult = DAGStateValue & DAGStateActions;

/**
 * DAGCanvas 受控模式的状态辅助 Hook。
 * 维护相互关联的 nodes 与 flow，并提供可直接传给 DAGCanvas 的变更回调；非受控模式无需使用。
 */
export default function useDAGState(initialState: Partial<DAGStateValue> = {}): UseDAGStateResult {
  const [dag, setDAGState] = useState<DAGStateValue>(() => ({
    nodes: initialState.nodes ?? [],
    flow: initialState.flow ?? [],
  }));

  const setNodes = useCallback<DAGStateActions["setNodes"]>((value) => {
    setDAGState((current) => {
      const nodes = typeof value === "function" ? value(current.nodes) : value;
      return nodes === current.nodes ? current : { ...current, nodes };
    });
  }, []);

  const setFlow = useCallback<DAGStateActions["setFlow"]>((value) => {
    setDAGState((current) => {
      const flow = typeof value === "function" ? value(current.flow) : value;
      return flow === current.flow ? current : { ...current, flow };
    });
  }, []);

  const setDAG = useCallback<DAGStateActions["setDAG"]>((value) => {
    setDAGState((current) => {
      const next = typeof value === "function" ? value(current) : value;
      if (next.nodes === current.nodes && next.flow === current.flow) return current;
      return { nodes: next.nodes ?? [], flow: next.flow ?? [] };
    });
  }, []);

  const onNodesChange = useCallback<DAGStateActions["onNodesChange"]>((changes) => {
    setDAGState((current) => {
      const nodes = applyNodeChanges(changes, current.nodes);
      return nodes === current.nodes ? current : { ...current, nodes };
    });
  }, []);

  const onFlowChange = useCallback<DAGStateActions["onFlowChange"]>((nextFlow) => {
    setDAGState((current) =>
      nextFlow === current.flow ? current : { ...current, flow: nextFlow },
    );
  }, []);

  return {
    nodes: dag.nodes,
    flow: dag.flow,
    setNodes,
    setFlow,
    setDAG,
    onNodesChange,
    onFlowChange,
  };
}
