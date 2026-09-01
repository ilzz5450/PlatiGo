import { logger, metadata, task } from "@trigger.dev/sdk"
import toposort from "toposort"
import {
  browserbase,
  Stagehand,
  type StagehandBrowser,
} from "@browserbasehq/stagehand"

import { getWorkflow } from "@/features/workflows/data"
import { interpolate, type NodeOutputs } from "@/features/workflows/lib/interpolate"
import { nodeExecutors, type NodeExecutor } from "@/features/workflows/Nodes/node-exe"

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

// The Node<->Browserbase CDP link is a WebSocket; when it drops mid-navigation
// the run surfaces undici/TLS close errors even though the browser itself did
// everything right (the tab loaded — it's just the result channel that died).
// Match that whole transport family so we know to rebuild the session and
// retry instead of failing the step.
function isTransportError(error: unknown): boolean {
  const summary = [
    error instanceof Error ? error.name : String(error),
    getErrorMessage(error),
  ]
    .join(" ")
    .toLowerCase()

  return [
    "websocket",
    "socket",
    "tls",
    "undici",
    "disturbed or locked",
    "econnreset",
    "econnrefused",
    "getaddrinfo",
    "closed before",
    "body should not be",
    "1006",
    "network",
  ].some((token) => summary.includes(token))
}

// Live execution status for a single node, published to run metadata so the
// canvas can render progress. Nodes move pending -> running -> done, or
// running -> failed (which stops the run).
export type RunStep = {
  nodeId: string
  status: "pending" | "running" | "done" | "failed"
}

export const runWorkflowTask = task({
  id: "run-workflow",

  // The CDP link to Browserbase drops transiently all the time; let the run
  // re-attempt from scratch with backoff rather than failing on first hiccup.
  retry: {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 3_000,
    maxTimeoutInMs: 30_000,
    randomize: true,
  },

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

    // `nodeId.path` -> what the user *typed* into that node's field. Used as a
    // fallback when a referenced node hasn't produced runtime output yet, so
    // `{{ id.url }}` resolves exactly as it displays on the canvas.
    const staticValues = Object.fromEntries(
      nodes.flatMap((node) =>
        Object.entries(node.data.values ?? {}).map(([path, value]) => [
          `${node.id}.${path}`,
          typeof value === "string" ? value : undefined,
        ])
      )
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

    // Pre-build the step list (all pending) and publish it immediately so the
    // canvas has the full plan before any node starts.
    const steps: RunStep[] = orderedNodeIds.map((nodeId) => ({
      nodeId,
      status: "pending",
    }))

    const publishSteps = () => {
      metadata.set("steps", steps)
    }

    const setStatus = (
      nodeId: string,
      status: RunStep["status"]
    ): RunStep | undefined => {
      const step = steps.find((s) => s.nodeId === nodeId)
      if (!step) return undefined
      step.status = status
      publishSteps()
      return step
    }

    publishSteps()
    await metadata.flush()

    let browser: StagehandBrowser | undefined
    let stagehand: Stagehand | undefined
    const nodeOutputs: NodeOutputs = {}

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

    // Runs one node's executor, retrying up to MAX_EXECUTOR_ATTEMPTS times on
    // transport-class failure by tearing down the dead CDP connection and
    // letting getStagehand() open a fresh Browserbase session. Everything else
    // (bad URL, logic error) propagates immediately.
    const MAX_EXECUTOR_ATTEMPTS = 3
    const runExecutorWithRetry = async (
      executor: NodeExecutor,
      values: Record<string, string>
    ): Promise<unknown> => {
      let lastError: unknown
      for (let attempt = 1; attempt <= MAX_EXECUTOR_ATTEMPTS; attempt++) {
        try {
          return await executor({ values, getStagehand })
        } catch (error) {
          lastError = error
          if (!isTransportError(error) || attempt === MAX_EXECUTOR_ATTEMPTS) {
            throw error
          }
          logger.warn(
            `Transport error on attempt ${attempt}/${MAX_EXECUTOR_ATTEMPTS}, rebuilding Browserbase session`,
            {
              transportError: getErrorDetails(error),
            }
          )
          await stagehand?.close().catch(() => undefined)
          await browser?.close().catch(() => undefined)
          stagehand = undefined
          browser = undefined
        }
      }
      throw lastError
    }

    try {
      for (const nodeId of orderedNodeIds) {
        const node = nodesById.get(nodeId)

        if (node) {
          logger.log(`Running step: ${node.data.title}`)

          const executor = nodeExecutors[node.data.type]

          if (executor) {
            // Mark running and force a flush so the spinner is pushed before
            // the executor gets a chance to immediately overwrite it with done.
            setStatus(node.id, "running")
            await metadata.flush()

            const values = Object.fromEntries(
              Object.entries(node.data.values ?? {}).map(([field, value]) => [
                field,
                interpolate({
                  text: value,
                  outputs: nodeOutputs,
                  staticValues,
                }),
              ])
            )

            try {
              nodeOutputs[node.id] = await runExecutorWithRetry(
                executor,
                values
              )
              setStatus(node.id, "done")
            } catch (error) {
              // Mark failed and flush before the run stops — a thrown run
              // returns no output, so this flushed metadata is the only way
              // the failed state reaches the canvas.
              setStatus(node.id, "failed")
              await metadata.flush()
              logger.error(`Step failed: ${node.data.title}`, {
                stepError: getErrorDetails(error),
              })
              throw error
            }
          }
        }
      }
    } finally {
      await stagehand?.close()
      await browser?.close()
    }

    return {
      steps,
    }
  },
})
