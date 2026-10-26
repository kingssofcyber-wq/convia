export function Hero() {
  return (
    <section className="relative pt-16 pb-10 text-center overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 ring-4 ring-green-500/20" />
          Every need, one place
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5 leading-[1.1]">
          All-in-one PDF toolkit
          <br />
          <span className="gradient-text">— in one place.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-2 leading-relaxed">
          Merge, split, compress, convert, and edit PDFs — 29 free tools,
          100% private, working right in your browser.
        </p>
      </div>
    </section>
  );
}