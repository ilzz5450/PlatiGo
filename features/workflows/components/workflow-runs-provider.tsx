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

// Statuses that mean the run is still in flight (live) vs finished. "Live"
// covers waiting-to-run and actively-executing runs.
const LIVE_STATUSES = new Set(["QUEUED", "EXECUTING", "REATTEMPTING", "DELAYED"]);

type WorkflowRunsContextValue = {
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

// A single shared realtime subscription to this workflow's runs (by their
// `workflow:<id>` tag). Any component under this provider can read the latest
// run's step progress via `useLatestRunSteps`.
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

  const { runs } = useRealtimeRunsWithTag<typeof runWorkflowTask>(tag, {
    accessToken: publicAccessToken,
    // We only need the final output steps + live metadata steps; skip the
    // (potentially large) input payload.
    skipColumns: ["payload"],
  });

  const value = useMemo<WorkflowRunsContextValue>(() => {
    // Most recent run first. Use createdAt (newest timestamp = newest run).
    const latest = [...runs].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

    if (!latest) {
      return { steps: [], isLive: false, status: undefined };
    }

    // Prefer the run's final output steps; a live run has no output yet, so
    // fall back to the metadata steps published as it executes.
    const preferred =
      (latest.output as { steps?: RunStep[] } | undefined)?.steps ??
      (latest.metadata?.steps as RunStep[] | undefined) ??
      [];

    return {
      steps: preferred,
      isLive: isRunLive(latest.status),
      status: latest.status,
    };
  }, [runs]);

  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  );
}

function useWorkflowRuns() {
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
