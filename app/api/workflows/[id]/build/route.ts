import { auth } from "@clerk/nextjs/server"
import { nodeRegistry, type NodeType, type StepNodeType } from "@/features/workflows/Nodes/node-registry"
import { validateGraph } from "@/features/workflows/lib/graph-validation"
import { getWorkflow } from "@/features/workflows/data"
import type { Edge } from "@xyflow/react"

type BuildRequest = {
  prompt?: string
  graph?: { nodes?: StepNodeType[]; edges?: Edge[] }
}

const nodeManifest = Object.values(nodeRegistry).map((definition) => ({
  type: definition.type,
  kind: definition.kind,
  label: definition.label,
  fields: definition.fields,
  outputs: definition.outputs,
}))

function parseModelJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]
  return JSON.parse(fenced ?? text)
}

async function getGeminiModel(apiKey: string) {
  const configuredModel = process.env.GEMINI_MODEL?.trim()
  if (configuredModel) return configuredModel.replace(/^models\//, "")

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  )
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Gemini model discovery failed (${response.status}): ${detail}`)
  }

  const payload = (await response.json()) as {
    models?: { name?: string; supportedGenerationMethods?: string[] }[]
  }
  const preferredModels = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
  const availableModels = (payload.models ?? [])
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model) => model.name?.replace(/^models\//, ""))
    .filter((model): model is string => Boolean(model))

  return preferredModels.find((model) => availableModels.includes(model)) ?? availableModels[0]
}

function normalizeGraph(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Gemini returned an invalid workflow")

  const result = value as { nodes?: unknown; edges?: unknown }
  if (!Array.isArray(result.nodes) || !Array.isArray(result.edges)) {
    throw new Error("Gemini must return nodes and edges arrays")
  }

  const nodes: StepNodeType[] = result.nodes.map((rawNode, index) => {
    const node = rawNode as Partial<StepNodeType> & { data?: Partial<StepNodeType["data"]> }
    const type = node.data?.type as NodeType
    const definition = nodeRegistry[type]
    if (!definition) throw new Error(`Gemini returned unsupported node type at index ${index}`)

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
      throw new Error(`Gemini returned an edge with an unknown node at index ${index}`)
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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth()
  if (!orgId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const workflow = await getWorkflow(orgId, id)
  if (!workflow[0]) return Response.json({ error: "Workflow not found" }, { status: 404 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY is not configured" }, { status: 503 })

  const body = (await request.json()) as BuildRequest
  const prompt = body.prompt?.trim()
  if (!prompt) return Response.json({ error: "Enter a workflow prompt" }, { status: 400 })

  const currentGraph = body.graph ?? { nodes: [], edges: [] }
  const instruction = `You are the workflow builder for PlatiGo. Build a complete executable workflow from the user's request.

Available node definitions (use only these types and their fields):
${JSON.stringify(nodeManifest, null, 2)}

Return JSON only in this exact shape: {"nodes":[{"id":"...","type":"step","position":{"x":0,"y":0},"data":{"type":"...","kind":"trigger|action","title":"...","values":{"field":"value"}}}],"edges":[{"id":"...","source":"node-id","target":"node-id","type":"smoothstep","animated":true}]}

Rules: include exactly one Go node with data.type start; connect every executable step in logical order; use {{ node-id.path }} tokens when a later field needs an upstream output; position nodes left-to-right with about 260px between steps; never invent node types or fields. You may replace or improve the current graph.

Current graph:
${JSON.stringify(currentGraph, null, 2)}

User request:
${prompt}`

  try {
    const model = await getGeminiModel(apiKey)
    if (!model) throw new Error("Gemini returned no model that supports generateContent")

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: instruction }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Gemini request failed (${response.status}): ${detail}`)
    }
    const payload = await response.json()
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text !== "string") throw new Error("Gemini returned no workflow")

    const graph = normalizeGraph(parseModelJson(text))
    return Response.json({ graph })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not build workflow"
    return Response.json({ error: message }, { status: 422 })
  }
}