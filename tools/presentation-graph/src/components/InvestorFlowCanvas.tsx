import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlignHorizontalSpaceAround, ScanSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { NodeTypes } from "@xyflow/react";
import raw from "../data/investor-graph.json";
import { InvestorNode } from "./InvestorNode";
import { buildInvestorFocusView } from "../lib/investorFocusView";
import {
  GROUP_PRESENTATION,
  type InvestorGroup,
} from "../lib/investorGraphGroups";
import {
  elkComfortLabel,
  layoutWithElk,
  nextElkComfort,
  toFlowEdges,
  toFlowNodes,
  type ElkComfort,
  type InvestorGraphFile,
} from "../lib/elkLayout";

const data = raw as InvestorGraphFile;

const nodeTypes: NodeTypes = {
  investor: InvestorNode,
};

/** Enfant de `<ReactFlow>` : recentre la vue après layout ELK (`layoutTick` > 0). */
function FitViewAfterLayout({
  layoutTick,
  comfort,
}: {
  layoutTick: number;
  comfort: ElkComfort;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (layoutTick === 0) return;
    const padding =
      comfort === "wide" ? 0.1 : comfort === "spacious" ? 0.14 : 0.18;
    const id = requestAnimationFrame(() => {
      void fitView({
        padding,
        minZoom: 0.04,
        maxZoom: 1.35,
        duration: 0,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [layoutTick, comfort, fitView]);

  return null;
}

function LayoutToolbar({
  comfort,
  onNextComfort,
}: {
  comfort: ElkComfort;
  onNextComfort: () => void;
}) {
  const { fitView } = useReactFlow();

  return (
    <Panel position="top-right" className="pg-flow-panel">
      <div className="pg-flow-panel__row">
        <button
          type="button"
          className="pg-flow-panel__btn"
          onClick={onNextComfort}
          title={`Passer au mode « ${elkComfortLabel(nextElkComfort(comfort))} » (réorganise le graphe ELK)`}
        >
          <AlignHorizontalSpaceAround size={16} aria-hidden />
          Espacer la vue
        </button>
        <span className="pg-flow-panel__hint" aria-live="polite">
          Mode&nbsp;: {elkComfortLabel(comfort)}
        </span>
        <span className="pg-flow-panel__hint pg-flow-panel__hint--wide" aria-live="polite">
          Clic sur un bloc&nbsp;: surbrillance des liens. Clic sur le fond&nbsp;: tout
          réafficher.
        </span>
      </div>
      <button
        type="button"
        className="pg-flow-panel__btn pg-flow-panel__btn--secondary"
        onClick={() =>
          void fitView({ padding: 0.16, minZoom: 0.04, maxZoom: 1.35, duration: 200 })
        }
      >
        <ScanSearch size={16} aria-hidden />
        Recadrer
      </button>
    </Panel>
  );
}

function InvestorFlowInner() {
  const initialNodes = useMemo(() => toFlowNodes(data), []);
  const initialEdges = useMemo(() => toFlowEdges(data), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [layoutTick, setLayoutTick] = useState(0);
  const [comfort, setComfort] = useState<ElkComfort>("spacious");
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  useEffect(() => {
    setFocusedNodeId(null);
  }, [comfort]);

  useEffect(() => {
    if (focusedNodeId && !nodes.some((n) => n.id === focusedNodeId)) {
      setFocusedNodeId(null);
    }
  }, [focusedNodeId, nodes]);

  const effectiveFocus = useMemo(() => {
    if (!focusedNodeId) return null;
    return nodes.some((n) => n.id === focusedNodeId) ? focusedNodeId : null;
  }, [focusedNodeId, nodes]);

  const { nodes: viewNodes, edges: viewEdges } = useMemo(
    () => buildInvestorFocusView(nodes, edges, effectiveFocus),
    [nodes, edges, effectiveFocus],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { nodes: nextNodes, edges: nextEdges } = await layoutWithElk(
          initialNodes,
          initialEdges,
          { comfort },
        );
        if (!cancelled) {
          setNodes(nextNodes);
          setEdges(nextEdges);
          setLayoutTick((n) => n + 1);
        }
      } catch (e) {
        console.error("[presentation-graph] ELK layout failed:", e);
        if (!cancelled) {
          setNodes(initialNodes);
          setEdges(initialEdges);
          setLayoutTick((n) => n + 1);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [comfort, initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <ReactFlow
      className="flow-rf"
      style={{ width: "100%", height: "100%" }}
      nodes={viewNodes}
      edges={viewEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, n) => {
        setFocusedNodeId(n.id);
      }}
      onPaneClick={() => {
        setFocusedNodeId(null);
      }}
      nodeTypes={nodeTypes}
      minZoom={0.05}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
      selectNodesOnDrag={false}
      nodesConnectable={false}
      elevateEdgesOnSelect={false}
      defaultEdgeOptions={{
        type: "step",
        style: { stroke: "var(--pg-edge-neutral)", strokeWidth: 1.35 },
      }}
    >
      <LayoutToolbar
        comfort={comfort}
        onNextComfort={() => setComfort((c) => nextElkComfort(c))}
      />
      <FitViewAfterLayout layoutTick={layoutTick} comfort={comfort} />
      <Background gap={20} color="var(--pg-grid)" />
      <Controls />
      <MiniMap
        pannable
        zoomable
        maskColor="var(--pg-minimap-mask)"
        nodeColor={(n) => {
          const g = n.data?.group;
          if (typeof g === "string" && g in GROUP_PRESENTATION) {
            return GROUP_PRESENTATION[g as InvestorGroup].stroke;
          }
          return "#64748b";
        }}
      />
    </ReactFlow>
  );
}

export function InvestorFlowCanvas() {
  return (
    <div className="flow-wrap">
      <ReactFlowProvider>
        <div className="flow-wrap__canvas">
          <InvestorFlowInner />
        </div>
      </ReactFlowProvider>
    </div>
  );
}
