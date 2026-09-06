export type ExecutionTimelineEvent = {
  id: string
  status: "running" | "success" | "warning" | "failed"
  message: string
  timestamp: number
  retryCount?: number
}

export type ExecutionResult = {
  status: "success" | "partial" | "failed"
  result: string
  format: "text" | "markdown" | "json"
  sources: string[]
  artifacts: string[]
  executionTime: number
  timeline: ExecutionTimelineEvent[]
  url?: string
}