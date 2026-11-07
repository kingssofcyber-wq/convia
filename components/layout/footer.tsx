import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const footerColumns = [
  {
    title: "PDF Tools",
    links: [
      { href: "/pdf/merge", label: "Merge PDF" },
      { href: "/pdf/split", label: "Split PDF" },
      { href: "/pdf/compress", label: "Compress PDF" },
      { href: "/pdf/edit", label: "Edit PDF" },
    ],
  },
  {
    title: "Finance & More",
    links: [
      { href: "/#loans", label: "EMI Calculator" },
      { href: "/#loans", label: "Loan Planner" },
      { href: "/#insurance", label: "Insurance" },
      { href: "/#health", label: "Health Tools" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main page-shell">
        <div className="footer-brand">
          <p className="footer-kicker">ONE PLACE FOR EVERYDAY ESSENTIALS</p>
          <p>Useful digital tools for documents, money, protection and everyday wellbeing — brought together in one simple workspace.</p>
        </div>
        <div className="footer-links">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <strong>{column.title}</strong>
              {column.links.map((link) => (
                <Link key={link.label} href={link.href}>{link.label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="footer-signature">
        <div className="footer-logo-lockup">
          <span className="brand-mark footer-brand-mark"><span /><span /><span /></span>
          <span className="footer-site-name">Convia<span>.</span></span>
        </div>
        <p className="footer-creator">Created by <strong>Mivaan Jangra</strong></p>
        <span className="footer-tagline">Every need, one place.</span>
      </div>

      <div className="footer-bottom page-shell">
        <span>© {new Date().getFullYear()} Convia. All rights reserved.</span>
        <span>Made for simpler everyday tasks. <ArrowUpRight size={12} /></span>
      </div>
    </footer>
  );
}
