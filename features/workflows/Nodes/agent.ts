import type { Stagehand } from "@browserbasehq/stagehand"
import { z } from "zod"

import type {
  ExecutionResult,
  ExecutionTimelineEvent,
} from "@/features/workflows/lib/execution-result"

type AgentEvent = {
  status: ExecutionTimelineEvent["status"]
  message: string
  retryCount?: number
}

export async function agent({
  stagehand,
  instruction,
  report,
}: {
  stagehand: Stagehand
  instruction: string
  report?: (event: AgentEvent) => void | Promise<void>
}): Promise<ExecutionResult> {
  const trimmed = (instruction ?? "").trim()

  if (!trimmed) {
    throw new Error(
      "Browser Agent: enter a complete objective, including the expected final result."
    )
  }

  let [page] = await stagehand.browser.context.pages()
  if (!page) page = await stagehand.browser.context.newPage()

  const startedAt = Date.now()
  const timeline: ExecutionTimelineEvent[] = []
  const emit = async (event: AgentEvent) => {
    const timelineEvent: ExecutionTimelineEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    timeline.push(timelineEvent)
    await report?.(event)
  }

  await emit({ status: "running", message: "Planning browser task" })

  let actionMessage = ""
  let lastError: unknown
  const configuredRetries = Number(process.env.BROWSER_AGENT_MAX_RETRIES ?? 2)
  const maxRetries = Number.isFinite(configuredRetries)
    ? Math.min(4, Math.max(1, configuredRetries))
    : 2

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await emit({
          status: "warning",
          message: "Re-inspecting the page and trying an alternate interaction",
          retryCount: attempt,
        })
        const { data: recoveryActions } = await stagehand.observe(
          "Inspect the current page and identify a safe recovery action. Close an obstructing dialog, switch to the relevant tab, or locate the equivalent semantic element."
        )
        const recoveryAction = recoveryActions?.[0]
        if (recoveryAction) await stagehand.act(recoveryAction)
      }

      await emit({
        status: "running",
        message: attempt === 0 ? "Executing browser plan" : "Retrying browser plan",
        retryCount: attempt,
      })
      const action = await stagehand.act(trimmed)
      actionMessage =
        (action as { message?: string } | undefined)?.message ??
        "Browser task completed"
      await emit({
        status: "success",
        message: "Browser action completed",
        retryCount: attempt,
      })
      break
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        await emit({
          status: "warning",
          message: "Browser action failed; recovery will retry",
          retryCount: attempt + 1,
        })
      }
    }
  }

  if (!actionMessage) {
    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError)
    await emit({ status: "failed", message: "Browser task failed" })
    throw new Error(
      `Browser Agent: task failed after ${maxRetries + 1} attempts. ${errorMessage}`,
      { cause: lastError }
    )
  }

  const finalUrl = (await page.url()) || ""
  if (!/^https?:\/\//i.test(finalUrl)) {
    await emit({ status: "failed", message: "Browser task produced no navigated page" })
    throw new Error(
      "Browser Agent: no real website was reached. The task was not reported as successful."
    )
  }

  let result = actionMessage
  try {
    await emit({ status: "running", message: "Extracting and validating the final result" })
    const extracted = await stagehand.extract(
      "Extract the useful final answer or data produced by the completed task. Return concise markdown or plain text. If no useful answer is present, return an empty string.",
      z.object({ result: z.string() })
    )
    const extractedResult = extracted.data.result.trim()
    if (extractedResult.length >= 12) result = extractedResult
  } catch {
    await emit({
      status: "warning",
      message: "Final extraction was unavailable; returning the browser action result",
    })
  }

  const finalUrlValue = finalUrl || undefined
  await emit({
    status: "success",
    message: "Result validated and ready for downstream nodes",
  })

  return {
    status: "success",
    result,
    format: "markdown",
    sources: finalUrlValue ? [finalUrlValue] : [],
    artifacts: [],
    executionTime: Date.now() - startedAt,
    timeline,
    url: finalUrlValue,
  }
}
