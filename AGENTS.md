<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:reactflow-agent-rules -->
# React Flow (Xyflow)

When using React Flow (`@xyflow/react`) APIs, components, hooks, or general usage, do NOT rely on training data. Instead, always fetch https://reactflow.dev/llms.txt (and linked pages) to get the current, accurate API reference before writing or changing React Flow code. The API evolves between versions (components like `ReactFlow`, `Background`, `Controls`, `Handle`; hooks like `useNodesState`, `useEdgesState`, `useReactFlow`; and types), so verify against the live docs.
<!-- END:reactflow-agent-rules -->

<!-- TRIGGER.DEV SKILLS START -->
## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.agents/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-authoring-chat-agent`, `trigger-authoring-tasks`, `trigger-chat-agent-advanced`, `trigger-cost-savings`, `trigger-getting-started`, `trigger-realtime-and-frontend`.
<!-- TRIGGER.DEV SKILLS END -->
