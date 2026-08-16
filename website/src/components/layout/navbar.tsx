"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/features", label: "Fonctionnalités" },
  { href: "/libre", label: "Libre" },
  { href: "/tablette", label: "Tablette" },
  { href: "/download", label: "Télécharger" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <nav className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/60 px-6 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 group-hover:glow-sm transition-shadow">
              <Zap className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Artisan
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    active
                      ? "text-white"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="navbar-active"
                      className="absolute inset-0 rounded-lg bg-white/[0.08]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/download"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-primary hover:bg-primary/90 text-white glow-sm hover:glow-md transition-shadow"
              )}
            >
              Télécharger
            </Link>
          </div>

          <button
            className="md:hidden text-muted-foreground hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mx-4 mt-2 rounded-2xl border border-white/[0.06] bg-black/80 backdrop-blur-xl p-4"
          >
            <div className="flex flex-col gap-1">
              {links.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-white/[0.08] text-white"
                        : "text-muted-foreground hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="mt-2 pt-2 border-t border-white/[0.06]">
                <Link
                  href="/download"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    buttonVariants(),
                    "w-full bg-primary hover:bg-primary/90 text-white glow-sm"
                  )}
                >
                  Télécharger
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
