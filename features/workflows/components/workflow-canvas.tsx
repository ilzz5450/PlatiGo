"use client"
import {StepNode} from "@/features/workflows/components/step-nodes"
import type {StepNodeType} from "@/features/workflows/Nodes/node-registry"
import React, { useCallback, useEffect, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  Edge,
  ColorMode,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
const nodeTypes: NodeTypes = {step: StepNode}

const initialNodes = [
  {
    id: "start",
    type: "step",
    position: { x: 0, y: 0 },
    data: { type: "start", kind: "trigger", title: "Go", values: {} },
  },
  {
    id: "open-url",
    type: "step",
    position: { x: 250, y: 0 },
    data: {
      type: "open-url",
      kind: "action",
      title: "Open URL",
      values: { url: "https://youtube.com" },
    },
  },
]

const initialEdges = [
  {
    id: "e-start-open-url",
    source: "start",
    target: "open-url",
    animated: true,
    style: { strokeWidth: 2, strokeDasharray: "6 6", stroke: "currentColor" },
    className: "dark:text-white/80 text-black/80",
  },
]


export function WorkflowCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [colorMode, setColorMode] = useState<ColorMode>("dark")

  useEffect(() => {
    const checkDark = () => {
      const isDark = document.documentElement.classList.contains("dark")
      setColorMode(isDark ? "dark" : "light")
    }
    checkDark()

    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="size-full dark:bg-black bg-white relative transition-colors duration-200">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={colorMode}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={34}
          size={1}
          color={colorMode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}
        />
        <Controls
          position="bottom-left"
          className="dark:bg-black dark:border-white/20 dark:text-white bg-white border-black/20 text-black border rounded-xl p-1.5 shadow-2xl flex gap-1.5 [&>button]:dark:bg-black [&>button]:dark:text-white [&>button]:bg-white [&>button]:text-black [&>button]:border-none [&>button:hover]:dark:bg-zinc-950 [&>button:hover]:bg-zinc-100"
        />
      </ReactFlow>
    </div>
  )
}
