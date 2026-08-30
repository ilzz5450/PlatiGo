import { and, desc, eq } from "drizzle-orm"
import {db} from "@/lib/db"
import{validateGraph} from "@/features/workflows/lib/graph-validation"
import {workflows} from "@/lib/db/schema"
import {WorkflowGraph} from "@/lib/db/schema"

export async function saveWorkflowGraph({
    orgId,
    id,
    graph,
}:{
    orgId: string
    id: string
    graph: WorkflowGraph
}){
    const problema = validateGraph(graph)

    if(problema.length > 0){
        throw new Error(problema.join(" ")) //stringify
    }
  await db
  .update(workflows)
  .set({graph, updatedAt: new Date()})
  .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
}

export function listWorkflows(orgId: string) {
    return db
.select().from(workflows).where(eq(workflows.orgId, orgId))
.orderBy(desc(workflows.createdAt))
}   // i will explicetly tell the agent or engineer in near future to use this format and refer this

export function createWorkflow(orgId: string, name: string) {
    return db
.insert(workflows)
.values({ orgId, name })
.returning()
}   // inserts a new workflow row for the given org and returns it

export function getWorkflow(orgId: string, id: string) {
    return db
.select().from(workflows).where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
.limit(1)
}   // returns the single workflow row matching both id and orgId

export function deleteWorkflow(orgId: string, id: string) {
    return db
.delete(workflows)
.where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
.returning()
}   // deletes the workflow matching both id and orgId from the database
