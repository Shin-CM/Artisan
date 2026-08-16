/** Aligné sur `normalize_contact_kind` côté Rust (`client_followup/contacts.rs`). */
export const CONTACT_EVENT_KIND_OPTIONS: { value: string; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "call", label: "Appel" },
  { value: "email", label: "E-mail" },
  { value: "meeting", label: "Rendez-vous" },
];

export function contactEventKindLabel(kind: string): string {
  return CONTACT_EVENT_KIND_OPTIONS.find((k) => k.value === kind)?.label ?? kind;
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
