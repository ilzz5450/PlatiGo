import { memo } from "react"
import { Trash2 } from "lucide-react"
import {
  Handle,
  Position,
  useStore,
  type NodeProps,
  useReactFlow,
} from "@xyflow/react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  nodeRegistry,
  type StepNodeType,
} from "@/features/workflows/Nodes/node-registry"
import { cn } from "@/lib/utils"

// Resolve a `{{ nodeId.path }}` placeholder against the live graph and render a
// human-friendly value on the node (e.g. show the referenced node's URL or
// title instead of the raw placeholder text). Unknown references fall back to
// the raw text.
function resolveReference(
  text: string,
  nodes: StepNodeType[]
): string {
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, expr) => {
    const [rawId, ...pathParts] = expr.trim().split(".")
    const node = nodes.find((n) => n.id === rawId)

    if (!node) return ""

    const path = pathParts.join(".")

    if (path === "title") {
      return node.data.title
    }

    // Any other output path maps to that field's stored value if present.
    const value = node.data.values?.[path]
    return typeof value === "string" ? value : ""
  })
}

function StepNodeComponent({ id, data, selected }: NodeProps<StepNodeType>) {
  const { deleteElements } = useReactFlow()
  const nodes = useStore((s) => s.nodes) as StepNodeType[]
  const { type, kind, title, values } = data
  const def = nodeRegistry[type]
  const Icon = def.icon

  // A trigger starts the flow and takes no input, so it has no target handle.
  const hasTarget = kind !== "trigger"

  const visibleValues = Object.entries(values)
    .filter(([, value]) => value && value.trim() !== "")
    .map(([key, value]) => [key, resolveReference(value, nodes)] as const)

  return (
    <div
      className={cn(
        "flow-node-3d min-w-50 max-w-80 rounded-(--radius) border-2 border-border bg-card text-card-foreground",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background"
      )}
    >
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ transform: "translate(-100%, -50%)" }}
          className="h-3.5! w-1.5! min-w-0! rounded-l-xs! rounded-r-none! border-0! bg-border!"
        />
      )}

      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            def.accent
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <span className="block text-sm font-semibold">{title}</span>
          {visibleValues.length > 0 && (
            <span className="block max-w-full truncate text-xs text-muted-foreground">
              {visibleValues[0][1]}
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Node actions"
              title="Node actions"
              className="nodrag nopan ml-auto flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => void deleteElements({ nodes: [{ id }] })}
            >
              <Trash2 />
              Remove node
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ transform: "translate(100%, -50%)" }}
        className="h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! bg-border!"
      />
    </div>
  )
}

export const StepNode = memo(StepNodeComponent)
