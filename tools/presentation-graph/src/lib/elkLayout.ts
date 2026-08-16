import ELK from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";
import type { InvestorGroup } from "./investorGraphGroups";

const elk = new ELK();

const NODE_W = 228;
const NODE_H = 56;

/** Presets d’espacement (ELK layered). */
export type ElkComfort = "standard" | "spacious" | "wide";

export type InvestorGraphFile = {
  nodes: { id: string; label: string; group: InvestorGroup }[];
  edges: { id: string; source: string; target: string }[];
};

function layoutOptionsForComfort(comfort: ElkComfort): Record<string, string> {
  const crossing = {
    "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    "elk.layered.crossingMinimization.greedySwitch.type": "TWO_SIDED",
  } as const;

  const placement = {
    "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
    "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
    "elk.layered.nodePlacement.favorStraightEdges": "true",
  } as const;

  const edgespace = {
    "elk.spacing.edgeNode": "36",
    "elk.layered.spacing.edgeNodeBetweenLayers": "44",
    "elk.spacing.edgeEdge": "24",
    "elk.layered.spacing.edgeEdgeBetweenLayers": "28",
  } as const;

  const base = {
    "elk.algorithm": "layered",
    "elk.direction": "RIGHT",
    "elk.hierarchyHandling": "INCLUDE_CHILDREN",
    ...crossing,
    ...placement,
    ...edgespace,
  } as Record<string, string>;

  if (comfort === "standard") {
    return {
      ...base,
      "elk.spacing.nodeNode": "52",
      "elk.layered.spacing.nodeNodeBetweenLayers": "88",
    };
  }
  if (comfort === "spacious") {
    return {
      ...base,
      "elk.spacing.nodeNode": "80",
      "elk.layered.spacing.nodeNodeBetweenLayers": "130",
    };
  }
  return {
    ...base,
    "elk.spacing.nodeNode": "108",
    "elk.layered.spacing.nodeNodeBetweenLayers": "190",
  };
}

export function nextElkComfort(current: ElkComfort): ElkComfort {
  if (current === "standard") return "spacious";
  if (current === "spacious") return "wide";
  return "standard";
}

export function elkComfortLabel(comfort: ElkComfort): string {
  if (comfort === "standard") return "Compact";
  if (comfort === "spacious") return "Confort";
  return "Très espacé";
}

export function toFlowNodes(data: InvestorGraphFile): Node[] {
  return data.nodes.map((n) => ({
    id: n.id,
    position: { x: 0, y: 0 },
    zIndex: 10,
    data: {
      label: n.label,
      group: n.group,
      pgDimmed: false,
      pgNeighbor: false,
      pgFocus: false,
    },
    type: "investor",
  }));
}

export function toFlowEdges(data: InvestorGraphFile): Edge[] {
  return data.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "step",
    pathOptions: { borderRadius: 10 },
  }));
}

export async function layoutWithElk(
  nodes: Node[],
  edges: Edge[],
  opts?: { comfort?: ElkComfort },
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const comfort = opts?.comfort ?? "spacious";
  const graph = {
    id: "root",
    layoutOptions: layoutOptionsForComfort(comfort),
    children: nodes.map((node) => ({
      id: node.id,
      width: NODE_W,
      height: NODE_H,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const layout = await elk.layout(graph);

  const idToPos = new Map<string, { x: number; y: number }>();
  for (const child of layout.children ?? []) {
    if (child.id) {
      idToPos.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
    }
  }

  const layoutedNodes = nodes.map((node) => {
    const pos = idToPos.get(node.id) ?? { x: 0, y: 0 };
    return {
      ...node,
      position: { x: pos.x, y: pos.y },
    };
  });

  const layoutedEdges = edges.map((e) => ({
    ...e,
    type: "step" as const,
    pathOptions: { borderRadius: 10 },
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
