import { task } from "@trigger.dev/sdk";

export const testWorkflowTask = task({
  id: "test-workflow",
  run: async (payload: { workflowId: string }) => {
    console.log(`Running test task for workflow ${payload.workflowId}`);

    return {
      message: `Test task ran for workflow ${payload.workflowId}`,
      timestamp: new Date().toISOString(),
    };
  },
});
