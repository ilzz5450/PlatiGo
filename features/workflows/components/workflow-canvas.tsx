"use client";

import { useEffect, useState } from "react";
import { Panel } from "@xyflow/react";
import { AvatarStack } from "@liveblocks/react-ui";

import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  ConnectionLineType,
  type ColorMode,
  type DefaultEdgeOptions,
  type ProOptions,
} from "@xyflow/react";

import { Cursors } from "@liveblocks/react-flow";

import {
  nodeTypes,
  useWorkflowFlow,
} from "@/features/workflows/components/workflow-flow";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

// Declare object references outside the component to prevent infinite re-renders
const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
  style: {
    strokeWidth: 2,
    strokeDasharray: "6 6",
  },
};

const PRO_OPTIONS: ProOptions = { hideAttribution: true };
const EMPTY_NODES: any[] = [];
const EMPTY_EDGES: any[] = [];

export function WorkflowCanvas() {
  // Liveblocks manages the collaborative nodes and edges, shared with the
  // palette in the right sidebar via WorkflowFlowProvider.
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useWorkflowFlow();

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
        nodes={nodes ?? EMPTY_NODES}
        edges={edges ?? EMPTY_EDGES}
        // Node changes
        onNodesChange={onNodesChange}
        // Edge changes
        onEdgesChange={onEdgesChange}
        // Creating a new connection
        onConnect={onConnect}
        // Deleting nodes/edges
        onDelete={onDelete}
        // Stable default edge options reference
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        // Stiff smoothstep connection line while dragging new edge
        connectionLineType={ConnectionLineType.SmoothStep}
        // React Flow light/dark mode
        colorMode={colorMode}
        // Automatically fit the workflow inside the canvas
        fitView
        // Hide React Flow branding with stable reference
        proOptions={PRO_OPTIONS}
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