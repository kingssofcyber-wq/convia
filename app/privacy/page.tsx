import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };
const updated = "9 November 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-14 sm:py-20">
      <header className="mb-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Convia policies</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
      </header>
      <article className="space-y-8 rounded-3xl border border-border bg-card p-6 leading-7 text-muted-foreground shadow-sm sm:p-10">
        <section><h2 className="mb-2 text-xl font-bold text-foreground">1. About this policy</h2><p>This policy explains how Convia ("we", "us") handles information when you visit convia.saanwariyasethfashion.com. It should be read together with the notice shown on each individual tool page.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">2. Files and tool processing</h2><p>Several currently available PDF utilities are designed to process files in your browser. For those tools, the selected file is read locally by the browser and the result is created on your device. Do not assume that every future feature uses the same method: a tool that needs a remote service must explain that before you submit a file. Do not upload confidential or sensitive documents unless you understand and accept the processing notice on that tool.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">3. Information you provide</h2><p>If you contact us, your email application or message provider may process the contact details and message you send. We may use that information to respond, handle a support request and maintain records of the correspondence. Do not include passwords, payment card details or unnecessary sensitive information in a support message.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">4. Technical information</h2><p>Our hosting provider and security systems may process technical information such as IP address, browser, device, request time and error logs to deliver and protect the website. Any analytics services, if enabled, should be disclosed here before they are activated.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">5. Cookies and advertising</h2><p>Convia may display advertisements provided by Google AdSense. Google and its advertising partners may use cookies or similar technologies to provide, measure and personalise advertising, subject to your location, consent choices and Google's settings. Learn about Google's advertising technologies at <a className="font-semibold text-primary underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">Google advertising technologies</a>. You can manage ad personalisation through your Google account and browser settings.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">6. Third-party services</h2><p>Some pages may load software libraries, fonts, hosting resources or advertising resources from third parties. Those providers may receive standard connection information when your browser requests their resources. Their own privacy terms apply to their services.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">7. Security and retention</h2><p>We use reasonable measures appropriate to operate the website. No website or transmission method can be guaranteed to be completely secure. Browser-processed files are generally held in the active page memory until you close or clear the page; contact correspondence may be retained as needed to respond and maintain business records.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">8. Children</h2><p>Convia is a general-purpose utility website and is not designed to collect personal information from children. If you believe a child has sent us personal information, contact us so we can review the request.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">9. Changes</h2><p>We may update this policy when the website or its services change. The latest revision date will be shown at the top of this page.</p></section>
        <section><h2 className="mb-2 text-xl font-bold text-foreground">10. Contact</h2><p>For privacy or support questions, email <a className="font-semibold text-primary underline" href="mailto:support@convia.com">support@convia.com</a>. Please confirm that this inbox is active before publishing this address.</p></section>
      </article>
    </main>
  );
}
