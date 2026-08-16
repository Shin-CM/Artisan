import type { Edge, Node } from "@xyflow/react";
import { neighborIdsForNode } from "./investorGraphGroups";

const FOCUS_EDGE_STROKE = "#fcd34d";
const DEFAULT_EDGE_STROKE = "var(--pg-edge-neutral)";

export function buildInvestorFocusView(
  nodes: Node[],
  edges: Edge[],
  focusId: string | null,
): { nodes: Node[]; edges: Edge[] } {
  if (!focusId) {
    const nextNodes = nodes.map((node) => ({
      ...node,
      zIndex: 10,
      data: {
        ...node.data,
        pgDimmed: false,
        pgNeighbor: false,
        pgFocus: false,
      },
    }));
    const nextEdges = edges.map((edge) => ({
      ...edge,
      animated: false,
      zIndex: 0,
      style: {
        ...edge.style,
        stroke: DEFAULT_EDGE_STROKE,
        strokeWidth: 1.35,
        opacity: 0.88,
      },
    }));
    return { nodes: nextNodes, edges: nextEdges };
  }

  const involved = neighborIdsForNode(focusId, edges);
  const nextNodes = nodes.map((node) => {
    let zIndex = 10;
    if (node.id === focusId) zIndex = 100;
    else if (involved.has(node.id)) zIndex = 50;

    return {
      ...node,
      zIndex,
      data: {
        ...node.data,
        pgDimmed: !involved.has(node.id),
        pgNeighbor: involved.has(node.id) && node.id !== focusId,
        pgFocus: node.id === focusId,
      },
    };
  });

  const nextEdges = edges.map((edge) => {
    const hit = edge.source === focusId || edge.target === focusId;
    return {
      ...edge,
      animated: hit,
      zIndex: 0,
      style: {
        ...edge.style,
        stroke: hit ? FOCUS_EDGE_STROKE : DEFAULT_EDGE_STROKE,
        strokeWidth: hit ? 3.25 : 1.15,
        opacity: hit ? 1 : 0.11,
      },
    };
  });

  return { nodes: nextNodes, edges: nextEdges };
}
