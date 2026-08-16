import { InvestorFlowCanvas } from "../components/InvestorFlowCanvas";

export function InvestorPage() {
  return (
    <div className="pg-page">
      <div className="pg-page__intro">
        <h1>Vue d’ensemble produit</h1>
        <p>
          Schéma simplifié des blocs fonctionnels — à adapter librement dans{" "}
          <code>src/data/investor-graph.json</code>.
        </p>
      </div>
      <InvestorFlowCanvas />
    </div>
  );
}
