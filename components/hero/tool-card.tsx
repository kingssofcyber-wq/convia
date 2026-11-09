import Link from "next/link";
import { categoryColors, type Tool } from "@/lib/tools-data";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;
  const color = categoryColors[tool.category];

  return (
    <Link
      href={tool.href}
      className="group relative flex flex-col p-6 rounded-[1.5rem] bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden"
    >
      {/* Subtle Hover Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}, transparent 70%)` }}
      />

      {/* Badge */}
      {tool.badge && (
        <span
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
            tool.badge === "AI"
              ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg shadow-pink-500/30"
              : "bg-primary text-white shadow-lg shadow-primary/30"
          }`}
        >
          {tool.badge}
        </span>
      )}

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl grid place-items-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
        style={{
          backgroundColor: color + "15",
          color: color,
        }}
      >
        {tool.formatLabel ? (
          <span className="text-[11px] font-extrabold tracking-tight leading-none text-center">
            {tool.formatLabel}
          </span>
        ) : Icon ? (
          <Icon className="w-7 h-7" strokeWidth={2.5} />
        ) : null}
      </div>

      {/* Text */}
      <h3 className="text-lg font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">
        {tool.name}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {tool.desc}
      </p>
    </Link>
  );
}