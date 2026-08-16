import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  /** Si absent : texte générique « en cours de développement ». */
  description?: string;
}) {
  const helpText = description ?? "Module en cours de développement.";
  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div>
        <PageTitleWithInfo description={helpText}>
          <h1 className="text-xl font-semibold">{title}</h1>
        </PageTitleWithInfo>
      </div>
    </div>
  );
}
