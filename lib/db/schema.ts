import type{StepNodeType} from "@/features/workflows/Nodes/node-registry"
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import type {Edge} from "@xyflow/react"

export type WorkflowGraph = {nodes: StepNodeType[]; edges:Edge[]}

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  graph: jsonb("graph").$type<WorkflowGraph>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Workflow = typeof workflows.$inferSelect

//Topological sort (toposort) is a linear ordering of the vertices in a directed graph where every directed edge from vertex u to vertex v means u comes before v in the ordering