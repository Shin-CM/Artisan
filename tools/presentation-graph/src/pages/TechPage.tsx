import { FileCode2 } from "lucide-react";

const CGC_DOC_URL =
  "https://github.com/CodeGraphContext/CodeGraphContext#-for-cli-toolkit-mode";

export function TechPage() {
  return (
    <div className="pg-page pg-page--tech">
      <div className="pg-page__intro">
        <h1>Vue technique</h1>
        <p>
          Affiche l’export HTML généré par{" "}
          <strong>CodeGraphContext</strong> (fichier{" "}
          <code>public/cgc/viz.html</code>). Remplacez ce fichier par votre
          export <code>--viz</code> pour explorer le graphe de code.
        </p>
        <a
          className="pg-link"
          href={CGC_DOC_URL}
          target="_blank"
          rel="noreferrer"
        >
          <FileCode2 size={16} aria-hidden />
          Documentation CodeGraphContext
        </a>
      </div>
      <div className="pg-tech-frame">
        <iframe
          title="Visualisation CodeGraphContext"
          src="/cgc/viz.html"
          className="pg-tech-frame__iframe"
        />
      </div>
    </div>
  );
}
