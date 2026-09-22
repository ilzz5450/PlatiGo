"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cancelWorkflowRun, deleteWorkflowAction, runWorkflowAction } from "@/features/workflows/actions"
import { toast } from "sonner"
import { Check, Clipboard, Download, LoaderCircle, MoreHorizontal, Play, Sparkles, Square, Trash2 } from "lucide-react"
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
import { useWorkflowRuns } from "@/features/workflows/components/workflow-runs-provider"

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
  const { addStepNode, applyWorkflowGraph, isBuilding, setIsBuilding } = useWorkflowFlow()
  const [prompt, setPrompt] = useState("")

  const buildWorkflow = async () => {
    if (!prompt.trim() || isBuilding) return
    setIsBuilding(true)
    try {
      // A build prompt always starts a fresh workflow. Clear both nodes and
      // edges before asking Gemini so stale canvas state cannot leak into the
      // generated graph or remain visible while it is being built.
      applyWorkflowGraph({ nodes: [], edges: [] })

      const response = await fetch(`/api/workflows/${workflowId}/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, graph: { nodes: [], edges: [] } }),
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
          Build with iLLuzzio
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

function ResultsPanel() {
  const { latestRun } = useWorkflowRuns()
  const [copied, setCopied] = useState(false)
  const finalResult = latestRun?.finalResult
  const resultText = finalResult?.result ?? ""

  // Collect any generated CSV or PDF outputs from completed run steps
  const steps = latestRun?.steps ?? []
  const csvOutputs = steps
    .filter((s) => s.nodeType === "datanaut" && s.status === "done" && s.output && typeof s.output === "object")
    .map((s) => s.output as { csv?: string; filename?: string })
    .filter((o) => Boolean(o.csv))

  const pdfOutputs = steps
    .filter((s) => s.nodeType === "pdf" && s.status === "done" && s.output && typeof s.output === "object")
    .map((s) => s.output as { pdfUrl?: string })
    .filter((o) => Boolean(o.pdfUrl))

  const copyResult = async () => {
    if (!resultText) return
    await navigator.clipboard.writeText(resultText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const downloadResult = () => {
    if (!resultText) return
    const blob = new Blob([resultText], { type: "text/markdown;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "platigo-result.md"
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const downloadCsv = (csvContent: string, filename = "platigo-data.csv") => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const downloadPdf = (pdfUrl: string) => {
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = "platigo-report.pdf"
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (!latestRun) {
    return <p className="p-3 text-xs text-muted-foreground">Run a workflow to see results here.</p>
  }

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
      <div className="flex items-center justify-between border-b border-border/50 pb-2 text-xs">
        <span className="font-medium">Latest run</span>
        <span className="text-muted-foreground">{latestRun.status}</span>
      </div>
      {!finalResult ? (
        <p className="text-xs text-muted-foreground">
          {latestRun.isLive ? "The workflow is still running." : "No result was produced."}
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">Final result</span>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="size-6" onClick={() => void copyResult()} title="Copy result">
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Clipboard className="size-3.5" />}
              </Button>
              <Button type="button" variant="ghost" size="icon" className="size-6" onClick={downloadResult} title="Download result">
                <Download className="size-3.5" />
              </Button>
            </div>
          </div>
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px]">
            {resultText}
          </pre>

          {/* Download CSV / PDF Artifacts Section */}
          {(csvOutputs.length > 0 || pdfOutputs.length > 0) && (
            <div className="space-y-2 border-t border-border/40 pt-2">
              <div className="text-xs font-semibold">Generated Files</div>
              <div className="flex flex-col gap-1.5">
                {csvOutputs.map((item, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 text-xs"
                    onClick={() => downloadCsv(item.csv ?? "", item.filename ?? "data.csv")}
                  >
                    <Download className="size-3.5 text-indigo-500" />
                    Download CSV ({item.filename ?? "report.csv"})
                  </Button>
                ))}
                {pdfOutputs.map((item, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 text-xs"
                    onClick={() => downloadPdf(item.pdfUrl ?? "")}
                  >
                    <Download className="size-3.5 text-orange-500" />
                    Download PDF Report
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="text-[11px] text-muted-foreground">
            {latestRun.deliveredViaEmail ? "Result delivered via Email with full attachments." : "Result available here."}
          </div>
          {finalResult.sources.length > 0 && (
            <div className="space-y-1 border-t border-border/40 pt-2">
              <div className="text-xs font-semibold">Sources</div>
              {finalResult.sources.map((source) => (
                <a key={source} href={source} target="_blank" rel="noreferrer" className="block truncate text-[11px] text-primary underline">
                  {source}
                </a>
              ))}
            </div>
          )}
          {finalResult.timeline.length > 0 && (
            <div className="space-y-1 border-t border-border/40 pt-2">
              <div className="text-xs font-semibold">Timeline</div>
              {finalResult.timeline.map((event) => (
                <div key={event.id} className="flex gap-1.5 text-[11px] text-muted-foreground">
                  <span>{event.status === "success" ? "[ok]" : event.status === "warning" ? "[!]" : "[-]"}</span>
                  <span>{event.message}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// starts of a Go of the current workflow.
function RunButton({ workflowId }: { workflowId: string }) {
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()
  const { latestRun } = useWorkflowRuns()
  const [isRunning, setIsRunning] = useState(false)
  const [runId, setRunId] = useState<string>()
  const [isStopping, setIsStopping] = useState(false)

  const runIsLive =
    isRunning &&
    (!runId || latestRun?.id !== runId || latestRun.isLive)

  const handleStop = async () => {
    if (isStopping) return
    if (!runId) {
      setIsRunning(false)
      return
    }

    setIsStopping(true)
    try {
      await cancelWorkflowRun({ workflowId, runId })
      setIsRunning(false)
      toast.success("Workflow stopped")
    } catch (error) {
      console.error("Failed to stop workflow:", error)
      toast.error(error instanceof Error ? error.message : "Failed to stop workflow")
    } finally {
      setIsStopping(false)
    }
  }

  const handleRun = async () => {
    if (runIsLive) return
    setIsRunning(true)
    setRunId(undefined)
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

      const handle = await runWorkflowAction({ id: workflowId, graph })
      setRunId(handle.id)
      toast.success("Workflow triggered successfully on Trigger.dev!")
    } catch (error) {
      console.error("Failed to run workflow:", error)
      toast.error(error instanceof Error ? error.message : "Failed to run workflow")
      setIsRunning(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      className="flow-gpo-3d"
      disabled={isStopping}
      onClick={() => void (runIsLive ? handleStop() : handleRun())}
    >
      {runIsLive ? <Square fill="currentColor" /> : <Play fill="currentColor" />}
      {runIsLive ? (isStopping ? "Stopping..." : "Stop") : "Run"}
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
          <TabsTrigger
            value="results"
            className="flow-panel-3d flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Results
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette workflowId={workflowId} />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector node={selectedNode} />
        </TabsContent>
        <TabsContent value="results" className="flex min-h-0 flex-1 flex-col">
          <ResultsPanel />
        </TabsContent>
      </Tabs>
    </ResizablePanel>
  )
}
