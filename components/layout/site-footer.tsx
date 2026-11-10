import Link from "next/link";
import { ConviaLogo } from "@/components/brand/convia-logo";

const columns = [
  { title: "PDF tools", links: [{ label: "Compress PDF", href: "/pdf/compress" }, { label: "Merge PDF", href: "/pdf/merge" }, { label: "Split PDF", href: "/pdf/split" }, { label: "Organize PDF", href: "/pdf/organize" }, { label: "All tools", href: "/#pdf-tools" }] },
  { title: "Explore", links: [{ label: "Loans & EMI", href: "/#loans" }, { label: "Insurance", href: "/#insurance" }, { label: "Health", href: "/#health" }, { label: "About Convia", href: "/about" }] },
  { title: "Information", links: [{ label: "Contact", href: "/contact" }, { label: "Privacy Policy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main page-container">
        <div className="footer-about">
          <ConviaLogo variant="inverse" tagline />
          <p>Useful digital tools for documents, money, protection and everyday wellbeing — brought together in one simple workspace.</p>
        </div>
        {columns.map((column) => <div className="footer-column" key={column.title}><h3>{column.title}</h3>{column.links.map((link) => <Link href={link.href} key={link.label}>{link.label}</Link>)}</div>)}
      </div>
      <div className="footer-signature">
        <ConviaLogo variant="inverse" tagline />
        <p className="footer-created">Created by <strong>Mivaan Jangra</strong></p>
        <p className="footer-tagline">Every need, one place.</p>
      </div>
      <div className="footer-bottom page-container"><span>© {new Date().getFullYear()} Convia. All rights reserved.</span><span>Made for simpler everyday tasks.</span></div>
    </footer>
  );
}
