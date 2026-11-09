"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navLinks = [
  { href: "/#pdf-tools", label: "PDF Tools" },
  { href: "/#loans", label: "Loans & EMI" },
  { href: "/#insurance", label: "Insurance" },
  { href: "/#health", label: "Health" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Convia home">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-base font-extrabold text-white shadow-sm">C</span>
          <span className="text-xl font-bold tracking-tight">Convia</span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" className="hidden sm:inline-flex" asChild><Link href="/login">Log in</Link></Button>
          <Button className="hidden sm:inline-flex" asChild><Link href="/signup">Sign up free</Link></Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="convia-mobile-navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div id="convia-mobile-navigation" className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              <Button variant="outline" className="flex-1" asChild><Link href="/login" onClick={() => setMobileOpen(false)}>Log in</Link></Button>
              <Button className="flex-1" asChild><Link href="/signup" onClick={() => setMobileOpen(false)}>Sign up</Link></Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
