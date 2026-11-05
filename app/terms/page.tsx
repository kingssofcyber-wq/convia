import { Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container max-w-4xl py-16">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Terms & Conditions</h1>
        <p className="text-muted-foreground">Last updated: October 2026</p>
      </div>

      <div className="bg-card border border-border p-8 md:p-12 rounded-3xl shadow-sm space-y-8 text-foreground/80 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">1. Agreement to Terms</h2>
          <p>By accessing or using Convia, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">2. Use of Our Services</h2>
          <p>You agree to use our tools only for lawful purposes. You must not use Convia to process illegal, harmful, or copyrighted material that you do not have permission to modify or distribute.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">3. Disclaimer of Liability</h2>
          <p>The tools on Convia are provided "as is" without any warranties. While we strive for perfection, we are not liable for any data loss, file corruption, or damages that may occur while using our tools. Always keep a backup of your original files.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">4. Intellectual Property</h2>
          <p>The design, layout, graphics, and code of Convia are the intellectual property of Convia and its creators. You may not copy, reproduce, or redistribute our website's design without explicit permission.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">5. Modifications</h2>
          <p>We reserve the right to modify these terms at any time. By continuing to use the site after changes are posted, you agree to the updated terms.</p>
        </section>
      </div>
    </div>
  );
}