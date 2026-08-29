"use client"

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
  Edge,
  ColorMode,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Trigger Node" },
    position: { x: 250, y: 50 },
    className: "dark:bg-white dark:text-black bg-black text-white border dark:border-black/20 border-white/20 rounded-xl shadow-lg font-mono text-xs p-3 transition-colors duration-200",
  },
  {
    id: "2",
    data: { label: "Data Ingestion" },
    position: { x: 250, y: 160 },
    className: "dark:bg-white dark:text-black bg-black text-white border dark:border-black/20 border-white/20 rounded-xl shadow-lg font-mono text-xs p-3 transition-colors duration-200",
  },
  {
    id: "3",
    type: "output",
    data: { label: "Database Sync" },
    position: { x: 250, y: 270 },
    className: "dark:bg-white dark:text-black bg-black text-white border dark:border-black/20 border-white/20 rounded-xl shadow-lg font-mono text-xs p-3 transition-colors duration-200",
  },
]

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "currentColor" }, className: "dark:text-white text-black" },
  { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "currentColor" }, className: "dark:text-white text-black" },
]

export function WorkflowCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [colorMode, setColorMode] = useState<ColorMode>("dark")

  // Sync color mode with html root dark class
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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={colorMode}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color={colorMode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}
        />
        <Controls
          position="bottom-left"
          className="dark:bg-black dark:border-white/20 dark:text-white bg-white border-black/20 text-black border rounded-lg p-1 shadow-xl flex gap-1 [&>button]:dark:bg-black [&>button]:dark:text-white [&>button]:bg-white [&>button]:text-black [&>button]:border-none [&>button:hover]:dark:bg-zinc-900 [&>button:hover]:bg-zinc-100"
        />
      </ReactFlow>
    </div>
  )
}
