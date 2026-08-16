import type { Metadata } from "next";
import { DownloadHero } from "@/components/download/download-hero";
import { DownloadPlatforms } from "@/components/download/download-platforms";
import { DownloadInfo } from "@/components/download/download-info";

export const metadata: Metadata = {
  title: "Télécharger",
  description:
    "Téléchargez Artisan gratuitement pour Windows ou macOS. Installation rapide, aucun compte requis.",
};

export default function DownloadPage() {
  return (
    <>
      <DownloadHero />
      <DownloadPlatforms />
      <DownloadInfo />
    </>
  );
}
