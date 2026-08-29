"use client";

import { useEffect, useState } from "react";
import {Panel} from "@xyflow/react"
import {AvatarStack} from "@liveblocks/react-ui"

import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  type NodeTypes,
  type ColorMode,
} from "@xyflow/react";

import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";

import { StepNode } from "@/features/workflows/components/step-nodes";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

// Register custom React Flow node types
const nodeTypes: NodeTypes = {
  step: StepNode,
};

// Initial nodes shown when the workflow is first created
const initialNodes = [
  {
    id: "start",
    type: "step",
    position: { x: 0, y: 0 },
    data: {
      type: "start",
      kind: "trigger",
      title: "Go",
      values: {},
    },
  },
  {
    id: "open-url",
    type: "step",
    position: { x: 250, y: 0 },
    data: {
      type: "open-url",
      kind: "action",
      title: "Open URL",
      values: {
        url: "https://youtube.com",
      },
    },
  },
];

// Initial connection between workflow nodes
const initialEdges = [
  {
    id: "e-start-open-url",
    source: "start",
    target: "open-url",
    animated: true,
    style: {
      strokeWidth: 2,
      strokeDasharray: "6 6",
      stroke: "currentColor",
    },
    className: "dark:text-white/80 text-black/80",
  },
];

export function WorkflowCanvas() {
  // Liveblocks manages the collaborative nodes and edges
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow({
    suspense: true,

    // Nodes that are present when the room has no existing nodes
    nodes: {
      initial: initialNodes,
    },

    // Edges that are present when the room has no existing edges
    edges: {
      initial: initialEdges,
    },
  });

  // Keep React Flow's color mode synchronized with the application's
  // Tailwind dark/light mode.
  const [colorMode, setColorMode] = useState<ColorMode>("dark");

  useEffect(() => {
    // Check whether the <html> element currently has the "dark" class
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");

      setColorMode(isDark ? "dark" : "light");
    };

    // Check the theme when the component mounts
    checkDarkMode();

    // Watch for changes to the <html> class attribute
    const observer = new MutationObserver(checkDarkMode);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Clean up the observer when the component unmounts
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative size-full bg-white transition-colors duration-200 dark:bg-black">
      <ReactFlow
        // Custom node components
        nodeTypes={nodeTypes}
        // Collaborative nodes and edges from Liveblocks
        nodes={nodes ?? initialNodes}
        edges={edges ?? initialEdges}
        // Node changes
        onNodesChange={onNodesChange}
        // Edge changes
        onEdgesChange={onEdgesChange}
        // Creating a new connection
        onConnect={onConnect}
        // Deleting nodes/edges
        onDelete={onDelete}
        // React Flow light/dark mode
        colorMode={colorMode}
        // Automatically fit the workflow inside the canvas
        fitView
        // Hide React Flow branding
        proOptions={{ hideAttribution: true }}
      >
        {/* Show other users' cursors */}
        <Cursors />

        {/* Workflow background grid */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={34}
          size={1}
          color={
            colorMode === "dark"
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)"
          }
        />

        {/* Zoom and viewport controls */}
        <Controls
          position="bottom-left"
          className="
            rounded-xl
            border
            border-black/20
            bg-white
            p-1.5
            text-black
            shadow-2xl
            transition-colors
            dark:border-white/20
            dark:bg-black
            dark:text-white

            [&>button]:border-none
            [&>button]:bg-white
            [&>button]:text-black
            [&>button:hover]:bg-zinc-100

            dark:[&>button]:bg-black
            dark:[&>button]:text-white
            dark:[&>button:hover]:bg-zinc-950
          "
        />
        <Panel position="top-right" className="m-4">
          <AvatarStack />
        </Panel>
      </ReactFlow>
    </div>
  );
}