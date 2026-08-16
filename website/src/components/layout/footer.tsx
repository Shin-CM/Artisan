import Link from "next/link";
import { Zap } from "lucide-react";

const footerLinks = {
  Produit: [
    { href: "/features", label: "Fonctionnalités" },
    { href: "/libre", label: "Libre" },
    { href: "/download", label: "Télécharger" },
  ],
  Ressources: [
    { href: "/features#pdf", label: "Export PDF" },
    { href: "/features#data-manager", label: "Data Manager" },
    { href: "/features#marketplace", label: "Marketplace" },
  ],
  Légal: [
    { href: "#", label: "Mentions légales" },
    { href: "#", label: "Confidentialité" },
    { href: "#", label: "CGU" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06]">
      <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <Zap className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Artisan
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Gérez vos devis et factures en toute simplicité, directement
              depuis votre bureau. 100 % hors ligne.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Artisan. Licence MIT.
          </p>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Fait avec</span>
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>pour les indépendants</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
