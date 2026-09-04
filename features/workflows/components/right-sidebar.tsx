"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteWorkflowAction, runWorkflowAction } from "@/features/workflows/actions"
import { toast } from "sonner"
import { LoaderCircle, MoreHorizontal, Play, Sparkles, Trash2 } from "lucide-react"
import { validateGraph } from "@/features/workflows/lib/graph-validation"
import { useReactFlow } from "@xyflow/react"


import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ResizablePanel } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  nodeRegistry,
  type NodeDefinition,
  type NodeField,
  type NodeType,
  type StepNodeKind,
  type StepNodeType,
} from "@/features/workflows/Nodes/node-registry"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { useWorkflowFlow } from "@/features/workflows/components/workflow-flow"
import { useUpstreamConnections } from "@/features/workflows/hooks/use-upstream-connections"

// A titled, scrollable panel. Each tab renders its content inside one. for the workflow 
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flow-panel-3d flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}


// A single editor field component that dynamically renders either a single-line input or a multi-line text area based on field.multiline.
function FieldInput({
  field,
  value,
  onChange,
  onFocus,
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
  onFocus: () => void
}) {
  // If multiline is enabled, render a textarea component; otherwise, use the standard single-line Input.
  if (field.multiline) {
    return (
      <Textarea
        id={field.key}
        value={value}
        placeholder={field.placeholder}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-20 resize-y text-xs"
      />
    )
  }

  return (
    <Input
      id={field.key}
      value={value}
      placeholder={field.placeholder}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function Inspector({ node }: { node: StepNodeType | undefined }) {
  const { updateStepNode } = useWorkflowFlow()
  const connections = useUpstreamConnections()
  const [lastEditedField, setLastEditedField] = useState<string>()

  if (!node) {
    return (
      <Section title="Edit Panel">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]
  const targetField = def.fields.some((field) => field.key === lastEditedField)
    ? lastEditedField
    : def.fields[0]?.key

  const insertConnectionToken = (token: string) => {
    if (!targetField) return

    const current = (values[targetField] ?? "").trim()

    // If the field is empty or already looks like a reference placeholder,
    // replace it entirely rather than appending — prevents accidental doubles
    // or malformed tokens like "{{ id }}{{ id }}".
    const isReference = current.startsWith("{{") && current.endsWith("}}")

    updateStepNode(node.id, {
      ...node.data,
      values: {
        ...values,
        [targetField]: isReference || !current ? token : `${current}${token}`,
      },
    })
  }

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key} className="text-xs">
                {field.label}
              </Label>
              <FieldInput
                field={field}
                value={values[field.key] ?? ""}
                onFocus={() => setLastEditedField(field.key)}
                onChange={(value) => {
                  setLastEditedField(field.key)
                  updateStepNode(node.id, {
                    ...node.data,
                    values: { ...values, [field.key]: value },
                  })
                }}
              />
            </div>
          ))
        )}
        {connections.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t pt-3">
            <Label className="text-xs">Connections</Label>
            <div className="flex flex-wrap gap-1.5">
              {connections.map((connection) => (
                <button
                  key={connection.token}
                  type="button"
                  title={connection.token}
                  onClick={() => insertConnectionToken(connection.token)}
                  className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted"
                >
                  <NodeIcon type={connection.nodeType} className="size-4" />
                  {connection.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

const sections: { kind: StepNodeKind; label: string }[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "PlatiGo Actions" },
]

//definitions 
const definitions = Object.values(nodeRegistry)


function Palette({ workflowId }: { workflowId: string }) {
  const { addStepNode, applyWorkflowGraph, edges, nodes, removeStepNode, isBuilding, setIsBuilding } = useWorkflowFlow()
  const [prompt, setPrompt] = useState("")

  const buildWorkflow = async () => {
    if (!prompt.trim() || isBuilding) return
    setIsBuilding(true)
    try {
      const seededOpenUrlId = "open-url"
      const graphWithoutSeededOpenUrl = {
        nodes: (nodes ?? []).filter((node) => node.id !== seededOpenUrlId),
        edges: (edges ?? []).filter(
          (edge) => edge.source !== seededOpenUrlId && edge.target !== seededOpenUrlId
        ),
      }

      if ((nodes ?? []).some((node) => node.id === seededOpenUrlId)) {
        removeStepNode(seededOpenUrlId)
      }

      const response = await fetch(`/api/workflows/${workflowId}/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, graph: graphWithoutSeededOpenUrl }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Could not build workflow")
      applyWorkflowGraph(result.graph)
      setPrompt("")
      toast.success("Workflow built")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build workflow")
    } finally {
      setIsBuilding(false)
    }
  }

  return (
    <Section title="Your Tools">
      <div className="border-b p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="size-3.5" />
          Build with Gemini
        </div>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe the workflow you want..."
          className="mb-2 min-h-20 resize-y text-xs"
          disabled={isBuilding}
        />
        <Button className="w-full gap-2 text-xs" onClick={() => void buildWorkflow()} disabled={!prompt.trim() || isBuilding}>
          {isBuilding ? <LoaderCircle className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {isBuilding ? "Building..." : "Build workflow"}
        </Button>
      </div>
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.kind)}
        className="px-3 py-2"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="flow-panel-3d py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => (
                  <Button
                    key={def.type}
                    variant="ghost"
                    onClick={() => addStepNode(def.type as NodeType)}
                    className="justify-start gap-2.5 px-1.5 text-xs"
                  >
                    <NodeIcon type={def.type as NodeType} />
                    {def.label}
                  </Button>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}


function ActionsMenu({ workflowId }: { workflowId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await deleteWorkflowAction(workflowId)
      toast.success("Workflow deleted successfully")
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Failed to delete workflow:", error)
      toast.error("Failed to delete workflow")
      setIsDeleting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuItem
          variant="destructive"
          className="text-xs [&_svg:not([class*='size-'])]:size-3.5"
          disabled={isDeleting}
          onSelect={(e) => {
            e.preventDefault()
            void handleDelete()
          }}
        >
          <Trash2 />
          {isDeleting ? "Deleting..." : "Delete workflow"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// starts of a Go of the current workflow.
function RunButton({ workflowId }: { workflowId: string }) {
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()
  const [isRunning, setIsRunning] = useState(false)

  const handleRun = async () => {
    if (isRunning) return
    setIsRunning(true)
    try {
      const nodes = getNodes()
      const edges = getEdges()
      const graph = { nodes, edges }

      const errors = validateGraph(graph)
      if (errors.length > 0) {
        toast.error("Cannot run workflow", {
          description: errors[0],
        })
        setIsRunning(false)
        return
      }

      await runWorkflowAction({ id: workflowId, graph })
      toast.success("Workflow triggered successfully on Trigger.dev!")
    } catch (error) {
      console.error("Failed to run workflow:", error)
      toast.error(error instanceof Error ? error.message : "Failed to run workflow")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      className="flow-gpo-3d"
      disabled={isRunning}
      onClick={() => void handleRun()}
    >
      <Play fill="currentColor" />
      {isRunning ? "Running..." : "Run"}
    </Button>
  )
}



export function RightSidebar({ workflowId }: { workflowId: string }) {
  const [tab, setTab] = useState("toolbar")
  const { selectedNode } = useWorkflowFlow()

  return (
    <ResizablePanel
      className="bg-background"
      defaultSize="16rem"
      minSize="14rem"
      maxSize="36rem"
      groupResizeBehavior="preserve-pixel-size"
    >
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <RunButton workflowId={workflowId} />
        </div>
        <TabsList className="m-2 w-fit bg-background">
          <TabsTrigger
            value="toolbar"
            className="flow-panel-3d flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Your Tools
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flow-panel-3d flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Edit Panel
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette workflowId={workflowId} />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector node={selectedNode} />
        </TabsContent>
      </Tabs>
    </ResizablePanel>
  )
}
