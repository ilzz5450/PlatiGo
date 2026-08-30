import { logger, task } from "@trigger.dev/sdk"
import toposort from "toposort"

import { getWorkflow } from "@/features/workflows/data"

export const runWorkflowTask = task({
  id: "run-workflow",
  run: async ({ workflowId, orgId }: { workflowId: string; orgId: string }) => {
    const [workflow] = await getWorkflow(orgId, workflowId)

    if (!workflow?.graph) {
      throw new Error(`Workflow ${workflowId} has no graph`)
    }

    const { nodes, edges } = workflow.graph
    const nodesById = new Map(nodes.map((node) => [node.id, node]))
    const connectedNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]))
    const orderedNodeIds = toposort
      .array(
        nodes.map((node) => node.id),
        edges.map((edge) => [edge.source, edge.target])
      )
      .filter((nodeId) => connectedNodeIds.has(nodeId))

    logger.log(`Running workflow ${workflow.name}`, { steps: orderedNodeIds.length })

    for (const nodeId of orderedNodeIds) {
      const node = nodesById.get(nodeId)

      if (node) {
        logger.log(`Running step: ${node.data.title}`)
      }
    }

    return { steps: orderedNodeIds.length }
  },
})
