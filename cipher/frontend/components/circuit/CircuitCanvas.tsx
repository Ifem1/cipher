"use client";
import React, { useRef } from "react";
import { Lattice, LatticeNode } from "@/lib/circuit/lattice";
import { NodeOutcome, OUTCOME_COLOR } from "@/lib/genlayer/status";

interface Props {
  lattice: Lattice;
  resolutions?: Record<string, { outcome: NodeOutcome }>;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string | null) => void;
  readonly?: boolean;
  width?: number;
  height?: number;
}

const GRID = 64;
const NODE_R = 28;

export function CircuitCanvas({
  lattice,
  resolutions = {},
  selectedNodeId,
  onSelectNode,
  readonly = false,
  width = 700,
  height = 480,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  function getNodePos(node: LatticeNode) {
    return {
      x: (node.x ?? 2) * GRID,
      y: (node.y ?? 2) * GRID,
    };
  }

  function nodeStroke(node: LatticeNode) {
    const res = resolutions[node.id];
    if (res) return OUTCOME_COLOR[res.outcome] ?? "var(--border)";
    if (selectedNodeId === node.id) return "var(--confirmed)";
    return "var(--border)";
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{
        background: "var(--void)",
        borderRadius: 12,
        display: "block",
      }}
      role="img"
      aria-label="Claim lattice circuit diagram"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="var(--trace)" />
        </marker>
        <marker
          id="arrowhead-active"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="var(--confirmed)" />
        </marker>

        {/* Grid dots */}
        <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
          <circle cx={0} cy={0} r={1} fill="var(--trace)" opacity={0.3} />
        </pattern>
      </defs>

      {/* Grid background */}
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Edges */}
      {lattice.edges.map((edge, i) => {
        const fromNode = lattice.nodes.find((n) => n.id === edge.from);
        const toNode = lattice.nodes.find((n) => n.id === edge.to);
        if (!fromNode || !toNode) return null;
        const from = getNodePos(fromNode);
        const to = getNodePos(toNode);

        const hasResolution =
          resolutions[edge.from] &&
          resolutions[edge.from].outcome === "CONFIRMED";

        // Control point for curved trace
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 20;

        return (
          <path
            key={i}
            d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
            stroke={hasResolution ? "var(--confirmed)" : "var(--trace)"}
            strokeWidth={2}
            fill="none"
            strokeDasharray={hasResolution ? "6 3" : undefined}
            markerEnd={`url(#${hasResolution ? "arrowhead-active" : "arrowhead"})`}
            aria-hidden="true"
          />
        );
      })}

      {/* Nodes */}
      {lattice.nodes.map((node) => {
        const pos = getNodePos(node);
        const isTerminal = node.type === "TERMINAL";
        const isSelected = selectedNodeId === node.id;
        const stroke = nodeStroke(node);
        const fill = "var(--raised)";

        return (
          <g
            key={node.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            onClick={() => !readonly && onSelectNode?.(isSelected ? null : node.id)}
            style={{ cursor: readonly ? "default" : "pointer" }}
            role={readonly ? undefined : "button"}
            aria-label={`Node ${node.id}: ${node.type} — weight ${node.weight}`}
            tabIndex={readonly ? undefined : 0}
            onKeyDown={(e) => {
              if (!readonly && (e.key === "Enter" || e.key === " ")) {
                onSelectNode?.(isSelected ? null : node.id);
              }
            }}
          >
            {/* Weight ring */}
            <circle
              r={NODE_R + 6}
              fill="none"
              stroke={stroke}
              strokeWidth={1}
              opacity={0.2}
            />

            {/* Node body */}
            {isTerminal ? (
              <rect
                x={-NODE_R}
                y={-NODE_R}
                width={NODE_R * 2}
                height={NODE_R * 2}
                rx={8}
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected ? 2 : 1.5}
              />
            ) : (
              <circle
                r={NODE_R}
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected ? 2 : 1.5}
              />
            )}

            {/* Type label */}
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={8}
              fontFamily="var(--font-mono)"
              fill={stroke}
              y={-8}
            >
              {node.type.slice(0, 3)}
            </text>

            {/* Weight */}
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={14}
              fontFamily="var(--font-display)"
              fontWeight={600}
              fill="var(--text)"
              y={6}
            >
              {node.weight}
            </text>

            {/* Resolution outcome */}
            {resolutions[node.id] && (
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={7}
                fontFamily="var(--font-mono)"
                fill={stroke}
                y={20}
              >
                {resolutions[node.id].outcome.slice(0, 4)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
