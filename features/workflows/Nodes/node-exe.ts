import type { Stagehand } from "@browserbasehq/stagehand"

import type {
  ActionNodeType,
  NodeType,
} from "@/features/workflows/Nodes/node-registry"
import { act } from "./act"
import { agent } from "./agent"
import { extract } from "./extract"
import { observation } from "./observation"
import { openUrl } from "./open-url"
import { sendEmail } from "./send-email"
import { aiPrompt } from "./ai-prompt"


export type NodeContext = {
  values: Record<string, string>
  getStagehand: () => Promise<Stagehand>
  report?: (event: {
    status: "running" | "success" | "warning" | "failed"
    message: string
    retryCount?: number
  }) => void | Promise<void>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  "open-url": async ({ values, getStagehand }) =>
    openUrl({ stagehand: await getStagehand(), url: values.url ?? "" }),
  act: async ({ values, getStagehand }) =>
    act({
      stagehand: await getStagehand(),
      instruction: values.instruction ?? "",
    }),
  extract: async ({ values, getStagehand }) =>
    extract({
      stagehand: await getStagehand(),
      instruction: values.instruction ?? "",
    }),
  observation: async ({ values, getStagehand }) =>
    observation({
      stagehand: await getStagehand(),
      instruction: values.instruction ?? "",
    }),
  agent: async ({ values, getStagehand, report }) =>
    agent({
      stagehand: await getStagehand(),
      instruction: values.instruction ?? "",
      report,
    }),
  "ai-prompt": async ({ values }) =>
    aiPrompt({ prompt: values.prompt ?? "" }),
  "send-email": async ({ values }) =>
    sendEmail({
      to: values.to ?? "",
      subject: values.subject ?? "",
      body: values.body ?? "",
    }),
} satisfies Record<ActionNodeType, NodeExecutor>