"use client";

import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import {
  useReactFlow,
  useStore,
  type Edge,
  type OnConnect,
  type OnDelete,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { toast } from "sonner";

import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/Nodes/node-registry";
import { StepNode } from "@/features/workflows/components/step-nodes";

export const nodeTypes = { step: StepNode };

const initialNodes: StepNodeType[] = [
  {
    id: "start",
    type: "step",
    position: { x: 0, y: 0 },
    data: {
      type: "start",
      kind: "trigger",
      title: "Go",
      values: {},
    },
  },
  {
    id: "open-url",
    type: "step",
    position: { x: 250, y: 0 },
    data: {
      type: "open-url",
      kind: "action",
      title: "Open URL",
      values: {
        url: "https://youtube.com",
      },
    },
  },
];

const initialEdges = [
  {
    id: "e-start-open-url",
    source: "start",
    target: "open-url",
    animated: true,
    style: {
      strokeWidth: 2,
      strokeDasharray: "6 6",
      stroke: "currentColor",
    },
    className: "dark:text-white/80 text-black/80",
  },
];

type WorkflowEdges = Edge[];

type WorkflowFlowContextValue = {
  nodes: StepNodeType[] | null;
  edges: WorkflowEdges | null;
  onNodesChange: OnNodesChange<StepNodeType>;
  onEdgesChange: OnEdgesChange<WorkflowEdges[number]>;
  onConnect: OnConnect;
  onDelete: OnDelete<StepNodeType, WorkflowEdges[number]>;
  addStepNode: (type: NodeType) => void;
  selectedNode: StepNodeType | undefined;
  updateStepNode: (nodeId: string, data: StepNodeType["data"]) => void;
};

const WorkflowFlowContext = createContext<WorkflowFlowContextValue | null>(null);

export function WorkflowFlowProvider({ children }: { children: ReactNode }) {
  const reactFlow = useReactFlow();
  const center = useStore((state) => ({
    x: state.width / 2,
    y: state.height / 2,
  }));

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<StepNodeType, WorkflowEdges[number]>({
    suspense: true,
    nodes: { initial: initialNodes },
    edges: { initial: initialEdges },
  });

  const addStepNode = useCallback(
    (type: NodeType) => {
      const def = nodeRegistry[type];

      const existing = nodes ?? [];
      const hasTrigger = existing.some(
        (node) => node.data.kind === "trigger"
      );

      if (def.kind === "trigger" && hasTrigger) {
        toast.error("Only one trigger allowed", {
          description: "A workflow can only have a single Go node.",
        });
        return;
      }

      const sameTypeCount = existing.filter(
        (node) => node.data.type === type
      ).length;

      const title =
        sameTypeCount === 0 ? def.label : `${def.label} ${sameTypeCount + 1}`;

      const position = reactFlow.screenToFlowPosition({
        x: center.x,
        y: center.y,
      });

      const item: StepNodeType = {
        id: crypto.randomUUID(),
        type: "step",
        position,
        data: {
          type,
          kind: def.kind,
          title,
          values: {},
        },
      };

      onNodesChange([{ type: "add", item }]);
    },
    [nodes, reactFlow, onNodesChange, center]
  );

  const selectedNode = nodes?.find((node) => node.selected);

  const updateStepNode = useCallback(
    (nodeId: string, data: StepNodeType["data"]) => {
      onNodesChange([
        {
          type: "replace",
          id: nodeId,
          item: {
            ...(nodes?.find((n) => n.id === nodeId) ?? ({} as StepNodeType)),
            id: nodeId,
            data,
          },
        },
      ]);
    },
    [nodes, onNodesChange]
  );

  const value: WorkflowFlowContextValue = {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
    addStepNode,
    selectedNode,
    updateStepNode,
  };

  return (
    <WorkflowFlowContext.Provider value={value}>
      {children}
    </WorkflowFlowContext.Provider>
  );
}

export function useWorkflowFlow() {
  const ctx = useContext(WorkflowFlowContext);
  if (!ctx) {
    throw new Error("useWorkflowFlow must be used within WorkflowFlowProvider");
  }
  return ctx;
}
