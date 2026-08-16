const STORAGE_KEY = "invoicies.followupContactApps.v1";

export type FollowupContactPrefs = {
  /** Valeur de la liste (vide = défaut système) */
  mailPreset: string;
  /** Si non vide, utilisé à la place du preset pour `mailto:` */
  mailCustom: string;
  telPreset: string;
  telCustom: string;
};

const defaults: FollowupContactPrefs = {
  mailPreset: "",
  mailCustom: "",
  telPreset: "",
  telCustom: "",
};

export function loadFollowupContactPrefs(): FollowupContactPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const o = JSON.parse(raw) as Partial<FollowupContactPrefs>;
    return {
      ...defaults,
      mailPreset: typeof o.mailPreset === "string" ? o.mailPreset : "",
      mailCustom: typeof o.mailCustom === "string" ? o.mailCustom : "",
      telPreset: typeof o.telPreset === "string" ? o.telPreset : "",
      telCustom: typeof o.telCustom === "string" ? o.telCustom : "",
    };
  } catch {
    return { ...defaults };
  }
}

export function saveFollowupContactPrefs(p: FollowupContactPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function resolveOpenWithForMail(p: FollowupContactPrefs): string | undefined {
  const c = p.mailCustom.trim();
  if (c) return c;
  const v = p.mailPreset.trim();
  return v || undefined;
}

export function resolveOpenWithForTel(p: FollowupContactPrefs): string | undefined {
  const c = p.telCustom.trim();
  if (c) return c;
  const v = p.telPreset.trim();
  return v || undefined;
}

export type HostOsKind = "macos" | "windows" | "linux" | "other";

/** Détection légère (WebView Tauri ou navigateur de dev). */
export function detectHostOsKind(): HostOsKind {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Macintosh|Mac OS X|iPhone|iPad/.test(ua)) return "macos";
  if (/Windows/.test(ua)) return "windows";
  if (/Linux/.test(ua)) return "linux";
  return "other";
}

/** Réponse IPC `list_url_handler_apps` (champs alignés sur le backend Rust). */
export type UrlHandlerApp = {
  label: string;
  open_with: string;
};

export type AppPreset = { value: string; label: string };

export const FOLLOWUP_MAIL_PRESETS: Record<HostOsKind, AppPreset[]> = {
  macos: [
    { value: "", label: "Défaut du système" },
    { value: "Mail", label: "Mail (Apple)" },
    { value: "Microsoft Outlook", label: "Microsoft Outlook" },
    { value: "Mozilla Thunderbird", label: "Mozilla Thunderbird" },
    { value: "Mimestream", label: "Mimestream" },
  ],
  windows: [
    { value: "", label: "Défaut du système" },
    { value: "Outlook", label: "Outlook" },
    { value: "thunderbird", label: "Thunderbird" },
  ],
  linux: [
    { value: "", label: "Défaut du système" },
    { value: "thunderbird", label: "Thunderbird" },
    { value: "geary", label: "Geary" },
  ],
  other: [{ value: "", label: "Défaut du système" }],
};

export const FOLLOWUP_TEL_PRESETS: Record<HostOsKind, AppPreset[]> = {
  macos: [
    { value: "", label: "Défaut du système" },
    { value: "FaceTime", label: "FaceTime" },
  ],
  windows: [{ value: "", label: "Défaut du système" }],
  linux: [{ value: "", label: "Défaut du système" }],
  other: [{ value: "", label: "Défaut du système" }],
};
