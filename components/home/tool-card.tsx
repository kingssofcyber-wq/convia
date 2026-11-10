import Link from "next/link";
import { categoryColors, type Tool } from "@/lib/tools-data";

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const color = categoryColors[tool.category];

  // जो टूल्स अभी नहीं बने हैं, उनके लिए Coming Soon
  const isComingSoon = ["pdf2word", "word2pdf", "pdf2jpg", "jpg2pdf", "excel2pdf", "ppt2pdf"].includes(tool.id) && !["jpg2pdf"].includes(tool.id); 
  // (ध्यान दें: JPG to PDF आपने पहले बना लिया था, तो उसे Available रखा है)

  return (
    <Link
      href={isComingSoon ? "#" : tool.href}
      className={`group relative flex flex-col p-5 rounded-[1.25rem] bg-background border border-border/60 transition-all duration-300 ${
        isComingSoon 
          ? "opacity-80 cursor-not-allowed grayscale-[20%]" 
          : "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
      }`}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-5">
        
        {/* Icon Container (हल्का बैकग्राउंड) */}
        <div
          className="w-11 h-11 rounded-xl grid place-items-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-sm"
          style={{ backgroundColor: color + "12", color: color }}
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