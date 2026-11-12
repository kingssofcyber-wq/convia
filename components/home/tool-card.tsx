import Link from "next/link";
import { categoryColors, type Tool } from "@/lib/tools-data";

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const color = categoryColors[tool.category];

  // यहाँ उन सभी टूल्स की लिस्ट है जो अभी बनकर तैयार हैं
  const builtTools = [
    "merge", "split", "compress", "organize", 
    "extract", "watermark", "jpg2pdf", "html2pdf", 
    "word2pdf", "pdf2word"
  ];

  // अगर टूल इस लिस्ट में नहीं है, तो वह Coming Soon है
  const isComingSoon = !builtTools.includes(tool.id);

  return (
    <Link
      href={tool.href} // अब सभी कार्ड क्लिक होंगे
      className="group relative flex flex-col p-5 rounded-[1.25rem] bg-background border border-border/60 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-11 h-11 rounded-xl grid place-items-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-sm"
          style={{ backgroundColor: color + "15", color: color }}
        >
          {Icon && <Icon className="w-5 h-5 group-hover:animate-bounce" strokeWidth={2.2} />}
        </div>

        {/* Small Badge */}
        <span
          className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase ${
            isComingSoon
              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" 
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          }`}
        >
          {isComingSoon ? "Coming soon" : "Available"}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="text-[15px] font-bold tracking-tight mb-1.5 text-foreground group-hover:text-primary transition-colors">
        {tool.name}
      </h3>
      <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
        {tool.desc}
      </p>
    </Link>
  );
}