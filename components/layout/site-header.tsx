"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, ArrowUpRight } from "lucide-react";
import { ConviaLogo } from "@/components/brand/convia-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const links = [
  { href: "/#pdf-tools", label: "PDF Tools" },
  { href: "/#loans", label: "Loans & EMI" },
  { href: "/#insurance", label: "Insurance" },
  { href: "/#health", label: "Health" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="announcement-bar">
        <span><i className="announcement-dot" /> Your everyday digital workspace</span>
        <span className="announcement-right">Simple tools. Clear results. <b>convia.workspace</b></span>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="header-logo" aria-label="Convia home"><ConviaLogo compact /></Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map((link) => <Link key={link.href} href={link.href} className="nav-link">{link.label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link href="/#pdf-tools" className="header-search" aria-label="Find a tool"><Search size={17}/><span>Find a tool</span></Link>
            <ThemeToggle />
            <Link href="/login" className="header-login">Log in</Link>
            <Link href="/signup" className="header-cta">Get started <ArrowUpRight size={15}/></Link>
            <button className="icon-button mobile-menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={20}/> : <Menu size={20}/>}</button>
          </div>
        </div>
        {open && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}<div className="mobile-nav-actions"><Link href="/login" onClick={() => setOpen(false)}>Log in</Link><Link href="/signup" onClick={() => setOpen(false)}>Get started</Link></div></nav>}
      </header>
    </>
  );
}
