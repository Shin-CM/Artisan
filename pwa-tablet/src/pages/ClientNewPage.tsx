import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createClient } from "../api";

export function ClientNewPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr("Indiquez un nom.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createClient({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });
      nav("/clients");
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link
        to="/clients"
        className="inline-flex items-center gap-1 text-sm text-sky-400 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>
      <h1 className="text-lg font-semibold">Nouveau client</h1>
      {err && (
        <p className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {err}
        </p>
      )}
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
        <label className="block text-sm text-slate-400">
          Nom *
          <input
            required
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm text-slate-400">
          Courriel
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm text-slate-400">
          Téléphone
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="block text-sm text-slate-400">
          Notes
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
