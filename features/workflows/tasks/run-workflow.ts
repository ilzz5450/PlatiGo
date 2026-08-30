import { logger, task } from "@trigger.dev/sdk"
import toposort from "toposort"
import {
  browserbase,
  Stagehand,
  type StagehandBrowser,
} from "@browserbasehq/stagehand"

import { getWorkflow } from "@/features/workflows/data"
import { nodeExecutors } from "@/features/workflows/Nodes/node-exe"

function getErrorDetails(error: unknown): Record<string, string | undefined> {
  if (!(error instanceof Error)) {
    return { message: String(error) }
  }

  const cause = error.cause

  return {
    name: error.name,
    message: error.message,
    causeName: cause instanceof Error ? cause.name : undefined,
    causeMessage: cause instanceof Error ? cause.message : undefined,
  }
}

function getErrorMessage(error: unknown): string {
  const details: string[] = []
  let current = error

  while (current instanceof Error) {
    details.push(`${current.name}: ${current.message}`)
    current = current.cause
  }

  return details.join(" -> ") || String(error)
}

export const runWorkflowTask = task({
  id: "run-workflow",

  run: async ({
    workflowId,
    orgId,
  }: {
    workflowId: string
    orgId: string
  }) => {
    const [workflow] = await getWorkflow(orgId, workflowId)

    if (!workflow?.graph) {
      throw new Error(`Workflow ${workflowId} has no graph`)
    }

    const { nodes, edges } = workflow.graph

    const nodesById = new Map(
      nodes.map((node) => [node.id, node])
    )

    const connectedNodeIds = new Set(
      edges.flatMap((edge) => [edge.source, edge.target])
    )

    const orderedNodeIds = toposort
      .array(
        nodes.map((node) => node.id),
        edges.map((edge) => [edge.source, edge.target])
      )
      .filter((nodeId) => connectedNodeIds.has(nodeId))

    logger.log(`Running workflow ${workflow.name}`, {
      steps: orderedNodeIds.length,
    })

    let browser: StagehandBrowser | undefined
    let stagehand: Stagehand | undefined

    const getStagehand = async (): Promise<Stagehand> => {
      if (stagehand) {
        return stagehand
      }

      const apiKey = process.env.BROWSERBASE_API_KEY

      if (!apiKey) {
        throw new Error(
          "BROWSERBASE_API_KEY is missing from the Trigger.dev environment. Add it as a secret environment variable and redeploy the task."
        )
      }

      try {
        browser = await browserbase.launch({ apiKey })
        logger.log("Browserbase session started", {
          browserbaseSessionId: browser.sessionId,
        })

        stagehand = await Stagehand.create({
          browser,
          logging: { level: "off" },
        })
      } catch (error) {
        logger.error("Browserbase session failed to start", {
          browserbaseError: getErrorDetails(error),
        })
        await browser?.close()
        browser = undefined
        throw new Error(`Browserbase session startup failed: ${getErrorMessage(error)}`, {
          cause: error,
        })
      }

      return stagehand
    }

    try {
      for (const nodeId of orderedNodeIds) {
        const node = nodesById.get(nodeId)

        if (node) {
          logger.log(`Running step: ${node.data.title}`)

          const executor = nodeExecutors[node.data.type]

          if (executor) {
            await executor({
              values: node.data.values ?? {},
              getStagehand,
            })
          }
        }
      }
    } finally {
      await stagehand?.close()
      await browser?.close()
    }

    return {
      steps: orderedNodeIds.length,
    }
  },
})
