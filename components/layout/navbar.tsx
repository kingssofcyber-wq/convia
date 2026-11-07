"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
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

  return (
    <>
      <div className="announcement-bar">
        <span className="announcement-dot" />
        <span>One simple workspace for your everyday digital needs</span>
        <Link href="/#pdf-tools">Explore Convia <ArrowUpRight size={12} /></Link>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Convia home">
            <span className="brand-mark"><span /><span /><span /></span>
            <span className="brand-name">convia<span>.</span></span>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <ThemeToggle />
            <Button variant="ghost" className="hidden md:inline-flex" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button className="header-signup hidden md:inline-flex" asChild>
              <Link href="/signup">Sign up free <ArrowUpRight size={15} /></Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="menu-toggle md:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        <nav className={`mobile-nav ${mobileOpen ? "open" : ""}`} aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="mobile-nav-actions">
            <Button variant="outline" className="flex-1" asChild><Link href="/login">Log in</Link></Button>
            <Button className="flex-1" asChild><Link href="/signup">Sign up</Link></Button>
          </div>
        </nav>
      </header>
    </>
  );
}
