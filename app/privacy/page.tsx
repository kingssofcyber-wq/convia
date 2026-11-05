import { Shield, Lock, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-4xl py-16">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-card border border-border p-8 md:p-12 rounded-3xl shadow-sm space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
          <p>Welcome to Convia ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">2. File Processing (100% Private)</h2>
          <p>Unlike many other PDF tools, <strong>Convia processes your files directly in your web browser.</strong> This means your PDFs, images, and documents are never uploaded to our servers. Your privacy is our top priority, and your files remain completely secure on your own device.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">3. Information We Collect</h2>
          <p>We do not collect personal data from you when you use our tools. However, we may collect non-personal information such as browser type, device type, and usage statistics to improve our services.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">4. Cookies and Web Beacons</h2>
          <p>We use cookies to store information about visitors' preferences and to record user-specific information on visits and pages the user views. This allows us to customize our content based on visitors' browser type and other information. We also use third-party advertisements (like Google AdSense) which may use cookies to serve ads based on users' prior visits to our website.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">5. Google DoubleClick DART Cookie</h2>
          <p>Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of the DART cookie enables it to serve ads to our users based on their visit to our site and other sites on the Internet. Users may opt-out of the use of the DART cookie by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/ads</a>.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">6. Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact us at <strong>support@convia.com</strong>.</p>
        </section>
      </div>
    </div>
  );
}