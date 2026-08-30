import type { Node } from "@xyflow/react"
import { Play, MousePointerClick, type LucideIcon } from "lucide-react"

export type StepNodeKind = "trigger" | "action"

// One editable field on a node, rendered as an input in the inspector later.
export type NodeField = {
  key: string
  label: string
  placeholder?: string
}

// A node type's manifest entry. Add a node by adding an entry to nodeRegistry.
export type NodeDefinition = {
  type: string
  kind: StepNodeKind
  label: string
  icon: LucideIcon
  accent: string // Tailwind classes for the icon chip color
  fields: NodeField[]
}

export const nodeRegistry = {
  start: {
    type: "start",
    kind: "trigger",
    label: "Go",
    icon: Play,
    accent: "bg-green-500 text-white",
    fields: [],
  },
  "open-url": {
    type: "open-url",
    kind: "action",
    label: "Open URL",
    icon: MousePointerClick,
    accent: "bg-yellow-500 text-white",
    fields: [{ key: "url", label: "URL", placeholder: "https://youtube.com" }],
  },
} satisfies Record<string, NodeDefinition>

export type NodeType = keyof typeof nodeRegistry


export type StepNodeData = {
  type: NodeType
  kind: StepNodeKind
  title: string
  values: Record<string, string>
}

export type StepNodeType = Node<StepNodeData, "step">
