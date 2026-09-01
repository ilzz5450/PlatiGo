import type { Node } from "@xyflow/react"
import { Play, ExternalLink, MousePointerClick, type LucideIcon } from "lucide-react"

export type StepNodeKind = "trigger" | "action"

// One editable field on a node, rendered as an input or textarea in the inspector.
export type NodeField = {
  key: string
  label: string
  placeholder?: string
  multiline?: boolean // Flag allowing fields to opt into multi-line textarea rendering
}

// A node type's manifest entry. Add a node by adding an entry to nodeRegistry.

export type NodeOutput = {
  path: string
  label: string
} // for the interpolate.ts 
export type NodeDefinition = {
  type: string
  kind: StepNodeKind
  label: string
  icon: LucideIcon
  accent: string // Tailwind classes for the icon chip color
  fields: NodeField[]
  outputs: NodeOutput[]
}

export const nodeRegistry = {
  start: {
    type: "start",
    kind: "trigger",
    label: "Go",
    icon: Play,
    accent: "bg-green-500 text-white",
    fields: [],
    outputs: [],
  },
  "open-url": {
    type: "open-url",
    kind: "action",
    label: "Open URL",
    icon: ExternalLink,
    accent: "bg-yellow-500 text-white",
    fields: [{ key: "url", label: "URL", placeholder: "https://youtube.com" }],
    outputs: [{ path: "url", label: "URL" }, { path: "title", label: "Title" }],
  },
  act: {
    type: "act",
    kind: "action",
    label: "Act",
    icon: MousePointerClick,
    accent: "bg-blue-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Click the sign in button",
        multiline: true,
      },
    ],
    outputs: [
      { path: "success", label: "Success" },
      { path: "message", label: "Message" },
      { path: "url", label: "URL" },
    ],
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

export type ActionNodeType = {
  [K in NodeType]: (typeof nodeRegistry)[K]["kind"] extends "action" ? K : never
}[NodeType]
