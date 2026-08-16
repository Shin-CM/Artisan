/** Filtre client des documents listés par `project_id` (shell projet). */
export function filterDocumentsByProjectId<T extends { projectId?: string | null }>(
  items: T[],
  projectId: string,
): T[] {
  const pid = projectId.trim();
  if (!pid) return items;
  return items.filter((x) => (x.projectId ?? "") === pid);
}
