import Link from "next/link";

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
    title: "Finance",
    links: [
      { href: "/#loans", label: "EMI Calculator" },
      { href: "/#loans", label: "Loan Application" },
      { href: "/#insurance", label: "Insurance Plans" },
      { href: "/#health", label: "Health Check" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center text-white font-extrabold text-base">
                C
              </div>
              <span className="font-bold text-xl tracking-tight">Convia</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Every need, one place. PDF tools, loan calculators, insurance
              estimates, and health checkers — free and private.
            </p>
          </div>

          {/* Columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-foreground">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 Convia. All rights reserved.</p>
          <p>Made with ❤️ for everyday needs.</p>
        </div>
      </div>
    </footer>
  );
}