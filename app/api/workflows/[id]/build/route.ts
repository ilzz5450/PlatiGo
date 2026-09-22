import { auth } from "@clerk/nextjs/server"
import { nodeRegistry, type NodeType, type StepNodeType } from "@/features/workflows/Nodes/node-registry"
import { validateGraph } from "@/features/workflows/lib/graph-validation"
import { getWorkflow } from "@/features/workflows/data"
import type { Edge } from "@xyflow/react"

type BuildRequest = {
  prompt?: string
  graph?: { nodes?: StepNodeType[]; edges?: Edge[] }
}

function normalizeGraph(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Invalid workflow graph")

  const result = value as { nodes?: unknown; edges?: unknown }
  if (!Array.isArray(result.nodes) || !Array.isArray(result.edges)) {
    throw new Error("Workflow must return nodes and edges arrays")
  }

  const nodes: StepNodeType[] = result.nodes.map((rawNode, index) => {
    const node = rawNode as Partial<StepNodeType> & { data?: Partial<StepNodeType["data"]> }
    const type = node.data?.type as NodeType
    const definition = nodeRegistry[type]
    if (!definition) throw new Error(`Unsupported node type at index ${index}`)

    return {
      id: typeof node.id === "string" && node.id ? node.id : crypto.randomUUID(),
      type: "step",
      position: {
        x: Number(node.position?.x ?? index * 260),
        y: Number(node.position?.y ?? 0),
      },
      data: {
        type,
        kind: definition.kind,
        title: typeof node.data?.title === "string" && node.data.title ? node.data.title : definition.label,
        values: typeof node.data?.values === "object" && node.data.values ? node.data.values : {},
      },
    }
  })

  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges: Edge[] = result.edges.map((rawEdge, index) => {
    const edge = rawEdge as Partial<Edge>
    if (typeof edge.source !== "string" || typeof edge.target !== "string" || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Edge references unknown node at index ${index}`)
    }
    return {
      id: typeof edge.id === "string" && edge.id ? edge.id : `e-${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: true,
    }
  })

  const graph = { nodes, edges }
  const errors = validateGraph(graph)
  if (errors.length > 0) throw new Error(errors[0])
  return graph
}

// 100% Local Rule-Based Intent Parser — Zero Gemini / LLM Cost!
function buildGraphLocally(prompt: string) {
  const p = prompt.toLowerCase()
  const nodes: StepNodeType[] = []
  const edges: Edge[] = []

  // 1. Always start with Go
  const startId = "start"
  nodes.push({
    id: startId,
    type: "step",
    position: { x: 0, y: 0 },
    data: { type: "start", kind: "trigger", title: "Go", values: {} },
  })

  let lastNodeId = startId

  // Helper to append a node and connect it
  const addNode = (type: NodeType, title: string, values: Record<string, string>) => {
    const id = crypto.randomUUID()
    const x = nodes.length * 260
    nodes.push({
      id,
      type: "step",
      position: { x, y: 0 },
      data: { type, kind: nodeRegistry[type].kind, title, values },
    })
    edges.push({
      id: `e-${lastNodeId}-${id}`,
      source: lastNodeId,
      target: id,
      type: "smoothstep",
      animated: true,
    })
    lastNodeId = id
    return id
  }

  // 2. URL detection or default web target
  let targetUrl = "https://example.com"
  if (p.includes("hacker news") || p.includes("ycombinator")) {
    targetUrl = "https://news.ycombinator.com"
  } else if (p.includes("youtube")) {
    targetUrl = "https://youtube.com"
  } else if (p.includes("google")) {
    targetUrl = "https://google.com"
  } else {
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/i)
    if (urlMatch) targetUrl = urlMatch[0]
  }

  addNode("open-url", "Open URL", { url: targetUrl })

  // 3. Browser Agent (iluzzio) or Act if requested
  if (p.includes("agent") || p.includes("search") || p.includes("find") || p.includes("scroll") || p.includes("navigate")) {
    addNode("agent", "iluzzio(Agent)", { instruction: prompt })
  }

  // 4. Extraction / Scrapling
  if (p.includes("extract") || p.includes("scrape") || p.includes("title") || p.includes("price") || p.includes("stories") || p.includes("data")) {
    addNode("extract", "Scrapling Extract", { instruction: prompt })
  }

  // 5. DataNaut (CSV / Excel)
  if (p.includes("csv") || p.includes("excel") || p.includes("datanaut") || p.includes("spreadsheet")) {
    addNode("datanaut", "DataNaut", {
      dataInput: `{{ ${lastNodeId}.result }}`,
      actionType: "download-csv",
    })
  }

  // 6. PDF Generator
  if (p.includes("pdf") || p.includes("document") || p.includes("report")) {
    addNode("pdf", "PDF Generator", {
      content: `{{ ${lastNodeId}.result }}`,
    })
  }

  // 7. Send Email
  if (p.includes("email") || p.includes("mail") || p.includes("send")) {
    addNode("send-email", "Send Email", {
      to: "user@example.com",
      subject: "Automated Report from Platigo",
      body: `Here is the ordered result:\n\n{{ ${lastNodeId}.result }}`,
    })
  }

  // Fallback if prompt was generic
  if (nodes.length === 2) {
    addNode("extract", "Scrapling Extract", { instruction: prompt })
  }

  return normalizeGraph({ nodes, edges })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const workflow = await getWorkflow(orgId, id)
  if (!workflow[0]) return Response.json({ error: "Workflow not found" }, { status: 404 })

  const body = (await request.json()) as BuildRequest
  const prompt = body.prompt?.trim()
  if (!prompt) return Response.json({ error: "Enter a workflow prompt" }, { status: 400 })

  try {
    const graph = buildGraphLocally(prompt)
    return Response.json({ graph })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not build workflow locally"
    return Response.json({ error: message }, { status: 422 })
  }
}