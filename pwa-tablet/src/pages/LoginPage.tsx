import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, KeyRound } from "lucide-react";
import { PageTitleWithInfo } from "../components/PageTitleWithInfo";
import { getStoredAuth, loginPassword, pairFromQrPayload } from "../api";

type BarcodeDetectorCtor = new (opts: {
  formats: string[];
}) => {
  detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};

export function LoginPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"qr" | "pwd">("qr");
  const [paste, setPaste] = useState("");
  const [apiBase, setApiBase] = useState("http://192.168.1.10:3847");
  const [workspaceId, setWorkspaceId] = useState("");
  const [username, setUsername] = useState("operateur");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const [camOn, setCamOn] = useState(false);

  useEffect(() => {
    if (getStoredAuth()) {
      nav("/clients", { replace: true });
    }
  }, [nav]);

  useEffect(
    () => () => {
      if (scanIntervalRef.current !== null) {
        window.clearInterval(scanIntervalRef.current);
      }
      const v = videoRef.current;
      if (v?.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        v.srcObject = null;
      }
    },
    [],
  );

  async function onPairPaste() {
    setErr(null);
    setBusy(true);
    try {
      await pairFromQrPayload(paste.trim());
      nav("/clients", { replace: true });
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onLoginPwd() {
    setErr(null);
    setBusy(true);
    try {
      await loginPassword({
        apiBase,
        workspaceId: workspaceId.trim(),
        username: username.trim(),
        password,
      });
      nav("/clients", { replace: true });
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  function stopCamera() {
    if (scanIntervalRef.current !== null) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    const v = videoRef.current;
    if (v?.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
    setCamOn(false);
  }

  async function startCamera() {
    setErr(null);
    const BD = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
      .BarcodeDetector;
    if (!BD) {
      setErr(
        "La caméra QR nécessite un navigateur avec BarcodeDetector (ex. Chrome sur tablette).",
      );
      return;
    }
    stopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream;
    await v.play();
    setCamOn(true);
    const detector = new BD({ formats: ["qr_code"] });
    scanIntervalRef.current = window.setInterval(async () => {
      try {
        const codes = await detector.detect(v);
        if (codes.length > 0 && codes[0].rawValue) {
          stopCamera();
          setBusy(true);
          try {
            await pairFromQrPayload(codes[0].rawValue);
            nav("/clients", { replace: true });
          } catch (e) {
            setErr(String(e));
          } finally {
            setBusy(false);
          }
        }
      } catch {
        /* frame ignorée */
      }
    }, 400);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div>
        <PageTitleWithInfo description="Connexion au logiciel sur votre réseau Wi‑Fi local.">
          <h1 className="text-xl font-semibold text-sky-400">Artisan Tablette</h1>
        </PageTitleWithInfo>
      </div>

      <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
        <button
          type="button"
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm ${
            tab === "qr" ? "bg-slate-800 text-white" : "text-slate-400"
          }`}
          onClick={() => setTab("qr")}
        >
          <QrCode className="h-4 w-4" />
          QR code
        </button>
        <button
          type="button"
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm ${
            tab === "pwd" ? "bg-slate-800 text-white" : "text-slate-400"
          }`}
          onClick={() => setTab("pwd")}
        >
          <KeyRound className="h-4 w-4" />
          Mot de passe
        </button>
      </div>

      {err && (
        <p className="rounded-md border border-amber-800 bg-amber-950/50 px-3 py-2 text-sm text-amber-200">
          {err}
        </p>
      )}

      {tab === "qr" && (
        <div className="space-y-3">
          <label className="block text-sm text-slate-400">
            Coller le contenu du QR (JSON)
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100"
              rows={4}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder='{"apiUrl":"http://…","pairingToken":"…","expiresIn":300}'
            />
          </label>
          <button
            type="button"
            disabled={busy || !paste.trim()}
            className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => void onPairPaste()}
          >
            Valider le pairing
          </button>
          <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-black">
            <video ref={videoRef} className="aspect-video w-full object-cover" playsInline muted />
          </div>
          <div className="flex gap-2">
            {!camOn ? (
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-lg border border-slate-600 py-2 text-sm"
                onClick={() => void startCamera().catch((e) => setErr(String(e)))}
              >
                Scanner avec la caméra
              </button>
            ) : (
              <button
                type="button"
                className="flex-1 rounded-lg border border-slate-600 py-2 text-sm"
                onClick={stopCamera}
              >
                Arrêter la caméra
              </button>
            )}
          </div>
        </div>
      )}

      {tab === "pwd" && (
        <div className="space-y-3">
          <label className="block text-sm text-slate-400">
            URL de l’API (ex. http://192.168.1.10:3847)
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
            />
          </label>
          <label className="block text-sm text-slate-400">
            Identifiant d’espace de travail (UUID)
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
            />
          </label>
          <label className="block text-sm text-slate-400">
            Nom d’utilisateur
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className="block text-sm text-slate-400">
            Mot de passe opérateur
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => void onLoginPwd()}
          >
            Se connecter
          </button>
        </div>
      )}
    </div>
  );
}
