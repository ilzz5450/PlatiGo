import { Spinner } from "@/components/ui/spinner"
import {
  nodeRegistry,
  type NodeType,
} from "@/features/workflows/Nodes/node-registry"
import { cn } from "@/lib/utils"

export function NodeIcon({
  type,
  className,
  running = false,
}: {
  type: NodeType
  className?: string
  running?: boolean
}) {
  const def = nodeRegistry[type]
  const Icon = def.icon

  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
        className
      )}
    >
      {running ? (
        <Spinner className="size-3.5 text-current" />
      ) : (
        <Icon className="size-3.5" />
      )}
    </span>
  )
}
