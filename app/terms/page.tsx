import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-14 sm:py-20">
      <header className="mb-10"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Convia policies</p><h1 className="text-4xl font-extrabold tracking-tight">Terms & Conditions</h1><p className="mt-3 text-sm text-muted-foreground">Last updated: 9 November 2026</p></header>
      <article className="space-y-8 rounded-3xl border border-border bg-card p-6 leading-7 text-muted-foreground shadow-sm sm:p-10">
        <section><h2 className="mb-2 text-xl font-bold text-foreground">1. Using Convia</h2><p>By visiting or using Convia, you agree to these terms. If you do not agree, do not use the website. Some listed features are marked Coming Soon and are not available for processing.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">2. User responsibility</h2><p>You are responsible for the files and content you select. Use Convia only for lawful purposes and only with documents you own or are authorised to process. Do not use the service to violate another person's privacy, intellectual-property rights or applicable law.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">3. File results and backups</h2><p>PDF tools can produce different results depending on file structure, fonts, encryption, signatures and browser support. Check every output before relying on it, and keep an original backup. Re-saving a signed PDF may invalidate a digital signature. We do not guarantee that every file can be processed or that every output will be identical to the source.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">4. Financial, insurance and health information</h2><p>Any financial calculations, insurance information or wellness content on Convia is for general educational use. It is not financial, insurance, medical or legal advice and does not replace advice from a qualified professional. Check assumptions and source information before making decisions.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">5. Availability</h2><p>We may modify, suspend or discontinue a tool to maintain, improve or protect the service. Features marked Coming Soon are planned but have no promised release date. We do not guarantee uninterrupted access or a particular compression or conversion result.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">6. Advertising and third-party services</h2><p>The website may display third-party advertisements and links. Third-party websites, products and services are governed by their own terms and privacy policies. An advertisement is not an endorsement by Convia.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">7. Intellectual property</h2><p>Unless otherwise stated, Convia's name, visual identity, original text and website design are owned by the project owner or used with permission. You may not copy or redistribute those materials without permission. You retain rights to files you upload or process.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">8. Limitation</h2><p>To the extent permitted by applicable law, Convia is provided on an "as available" basis. Nothing in these terms excludes a right or remedy that cannot lawfully be excluded.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">9. Updates and contact</h2><p>These terms may be updated as features change. Questions may be sent to <a className="font-semibold text-primary underline" href="mailto:support@convia.com">support@convia.com</a>. Confirm that this inbox is monitored before publication.</p></section>
      </article>
    </main>
  );
}
