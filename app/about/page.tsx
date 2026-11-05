import { Target, Zap, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container max-w-5xl py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          We Simplify Your <span className="gradient-text">Digital Life</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Convia was born out of a simple idea: everyday digital tasks should be fast, free, and incredibly private.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
          <Target className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">To provide a one-stop platform where anyone can easily manage their PDFs, calculate financial loans, and check their health—without worrying about hidden fees, watermarks, or privacy breaches.</p>
        </div>
        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
          <Zap className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-3">Why "Convia"?</h2>
          <p className="text-muted-foreground leading-relaxed">The name comes from "Convenience" + "Via" (the path). We want to be the easiest path to getting your daily tasks done. Built with cutting-edge web technology, our tools run directly in your browser.</p>
        </div>
      </div>

      <div className="text-center bg-muted/30 border border-border p-12 rounded-3xl">
        <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Made with Privacy in Mind</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          We don't store your files. We don't sell your data. Every PDF you merge, split, or compress stays on your device. We believe the internet should be a safer place, and it starts with tools that respect you.
        </p>
      </div>
    </div>
  );
}