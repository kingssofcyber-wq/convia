import Link from "next/link";
import { categoryColors, type Tool } from "@/lib/tools-data";
import { ArrowUpRight } from "lucide-react";

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const color = categoryColors[tool.category];

  return (
    <Link
      href={tool.href}
      className="group relative flex flex-col p-6 rounded-[1.5rem] bg-card border border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 overflow-hidden"
    >
      {/* Hover Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}, transparent 70%)` }}
      />

      {tool.badge && (
        <span className={`absolute top-5 right-5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
          tool.badge === "AI" ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white" : "bg-primary text-white"
        }`}>
          {tool.badge}
        </span>
      )}

      <div
        className="w-14 h-14 rounded-2xl grid place-items-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
        style={{ backgroundColor: color + "15", color: color }}
      >
        {tool.formatLabel ? (
          <span className="text-[11px] font-extrabold tracking-tight">{tool.formatLabel}</span>
        ) : Icon ? (
          <Icon className="w-7 h-7" strokeWidth={2.5} />
        ) : null}
      </div>

      <h3 className="text-lg font-bold tracking-tight mb-1.5 group-hover:text-primary transition-colors flex items-center justify-between">
        {tool.name}
        <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {tool.desc}
      </p>
    </Link>
  );
}