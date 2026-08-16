"use client";

import { useEffect, useState } from "react";
import { PlatformCard } from "./platform-card";

function WindowsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-neon-cyan" fill="currentColor">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-primary" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

type OS = "windows" | "mac" | "other";

function detectOS(): OS {
  if (typeof window === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "mac";
  return "other";
}

const platforms = {
  windows: {
    name: "Windows",
    icon: <WindowsIcon />,
    format: "Installateur NSIS (.exe)",
    size: "~25 Mo",
    downloadUrl: "#",
    requirements: [
      "Windows 10 ou supérieur",
      "64 bits (x86_64)",
      "WebView2 (inclus dans Windows 10+)",
      "200 Mo d'espace disque",
    ],
  },
  mac: {
    name: "macOS",
    icon: <AppleIcon />,
    format: "Image disque (.dmg)",
    size: "~20 Mo",
    downloadUrl: "#",
    requirements: [
      "macOS 11 Big Sur ou supérieur",
      "Apple Silicon (M1+) ou Intel",
      "150 Mo d'espace disque",
      "Aucune dépendance supplémentaire",
    ],
  },
};

export function DownloadPlatforms() {
  const [os, setOs] = useState<OS>("other");

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const ordered =
    os === "mac"
      ? [
          { ...platforms.mac, recommended: true },
          { ...platforms.windows, recommended: false },
        ]
      : [
          { ...platforms.windows, recommended: true },
          { ...platforms.mac, recommended: false },
        ];

  return (
    <section className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ordered.map((platform) => (
            <PlatformCard key={platform.name} {...platform} />
          ))}
        </div>
      </div>
    </section>
  );
}
