"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks";

import type { runWorkflowTask } from "@/features/workflows/tasks/run-workflow";
import type { RunStep } from "@/features/workflows/tasks/run-workflow";
import type { ExecutionResult } from "@/features/workflows/lib/execution-result";

// Statuses that mean the run is still in flight (live) vs finished. "Live"
// covers waiting-to-run and actively-executing runs.
const LIVE_STATUSES = new Set(["QUEUED", "EXECUTING", "REATTEMPTING", "DELAYED"]);

export type WorkflowRun = {
  id: string;
  status: string;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  durationMs?: number;
  isLive: boolean;
  steps: RunStep[];
  sessionId?: string;
  error?: string;
  finalResult?: ExecutionResult;
  deliveredViaEmail: boolean;
};

export type WorkflowRunsContextValue = {
  // All runs for this workflow, newest first.
  runs: WorkflowRun[];
  // The most recent run, or undefined if no runs exist yet.
  latestRun: WorkflowRun | undefined;
  // The most recent run's steps — preferring the final output, falling back to
  // the live metadata steps. Empty array if there are no runs yet.
  steps: RunStep[];
  // Whether the most recent run is still live (queued or executing).
  isLive: boolean;
  // The most recent run's raw status, if any run exists.
  status: string | undefined;
};

const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null);

function isRunLive(status: string | undefined): boolean {
  return !!status && LIVE_STATUSES.has(status);
}

function normalizeFinalResult(value: unknown): ExecutionResult | undefined {
  if (!value || typeof value !== "object") return undefined
  const candidate = value as Partial<ExecutionResult>
  if (typeof candidate.result !== "string") return undefined

  return {
    status: candidate.status === "failed" || candidate.status === "partial" ? candidate.status : "success",
    result: candidate.result,
    format: candidate.format === "json" || candidate.format === "text" ? candidate.format : "markdown",
    sources: Array.isArray(candidate.sources) ? candidate.sources.filter((item): item is string => typeof item === "string") : [],
    artifacts: Array.isArray(candidate.artifacts) ? candidate.artifacts.filter((item): item is string => typeof item === "string") : [],
    executionTime: typeof candidate.executionTime === "number" ? candidate.executionTime : 0,
    timeline: Array.isArray(candidate.timeline) ? candidate.timeline : [],
    url: typeof candidate.url === "string" ? candidate.url : undefined,
  }
}

// A single shared realtime subscription to this workflow's runs (by their
// `workflow:<id>` tag). Any component under this provider can read all runs
// and steps via `useWorkflowRuns`, or the latest run's step progress via `useLatestRunSteps`.
export function WorkflowRunsProvider({
  workflowId,
  publicAccessToken,
  children,
}: {
  workflowId: string;
  publicAccessToken: string;
  children: ReactNode;
}) {
  const tag = `workflow:${workflowId}`;

  const { runs: rawRuns } = useRealtimeRunsWithTag<typeof runWorkflowTask>(tag, {
    accessToken: publicAccessToken,
    // We only need the final output steps + live metadata steps; skip the
    // (potentially large) input payload.
    skipColumns: ["payload"],
  });

  const value = useMemo<WorkflowRunsContextValue>(() => {
    // Sort runs newest first by updatedAt / createdAt: a task retry re-streams
    // the same run id with a fresh attempt, and updatedAt bumps on every attempt,
    // so the newest attempt always wins over an older failed one.
    const sortedRaw = [...rawRuns].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const runs: WorkflowRun[] = sortedRaw.map((run) => {
      const preferredSteps =
        (run.output as { steps?: RunStep[] } | undefined)?.steps ??
        (run.metadata?.steps as RunStep[] | undefined) ??
        [];
      const sessionId = (run.output as { sessionId?: string } | undefined)?.sessionId;
      const finalResult = normalizeFinalResult(
        (run.output as { finalResult?: unknown } | undefined)?.finalResult
      );
      const deliveredViaEmail = Boolean(
        (run.output as { deliveredViaEmail?: boolean } | undefined)?.deliveredViaEmail
      );

      const startedAt = run.startedAt ? new Date(run.startedAt) : undefined;
      const finishedAt = run.finishedAt ? new Date(run.finishedAt) : undefined;
      const durationMs =
        startedAt && finishedAt
          ? finishedAt.getTime() - startedAt.getTime()
          : undefined;

      const runError = (run as { error?: unknown }).error;
      const error = runError
        ? typeof runError === "string"
          ? runError
          : typeof runError === "object" && runError !== null && "message" in runError
            ? String((runError as { message: unknown }).message)
            : String(runError)
        : undefined;

      return {
        id: run.id,
        status: run.status,
        createdAt: new Date(run.createdAt),
        startedAt,
        finishedAt,
        durationMs,
        isLive: isRunLive(run.status),
        steps: preferredSteps,
        sessionId,
        error,
        finalResult,
        deliveredViaEmail,
      };
    });

    const latestRun = runs[0];

    return {
      runs,
      latestRun,
      steps: latestRun?.steps ?? [],
      isLive: latestRun?.isLive ?? false,
      status: latestRun?.status,
    };
  }, [rawRuns]);

  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  );
}

export function useWorkflowRuns(): WorkflowRunsContextValue {
  const ctx = useContext(WorkflowRunsContext);
  if (!ctx) {
    throw new Error(
      "useWorkflowRuns must be used within a WorkflowRunsProvider"
    );
  }
  return ctx;
}

// The latest run's steps plus whether it's still live.
export function useLatestRunSteps(): {
  steps: RunStep[];
  isLive: boolean;
} {
  const { steps, isLive } = useWorkflowRuns();
  return { steps, isLive };
}
