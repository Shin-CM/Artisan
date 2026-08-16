import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Artisan — Devis & Factures, sans connexion",
    template: "%s | Artisan",
  },
  description:
    "Gérez vos devis et factures depuis votre bureau. Application desktop 100 % hors ligne, avec export PDF, catalogue produits et multi-workspaces.",
  keywords: [
    "facturation",
    "devis",
    "factures",
    "logiciel",
    "desktop",
    "hors ligne",
    "PDF",
    "freelance",
    "indépendant",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
