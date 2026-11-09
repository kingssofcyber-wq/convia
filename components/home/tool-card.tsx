import Link from "next/link";
import { categoryColors, type Tool } from "@/lib/tools-data";
import { isToolReady } from "@/lib/tool-status";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;
  const color = categoryColors[tool.category];
  const ready = isToolReady(tool.id);

  return (
    <Link
      href={tool.href}
      aria-label={`${tool.name}${ready ? " — available" : " — coming soon"}`}
      className="group relative flex min-h-[160px] flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
      style={{ "--hover-color": color } as React.CSSProperties}
    >
      <span className={`absolute right-3 top-3 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${ready ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
        {ready ? "Available" : "Coming Soon"}
      </span>

      <div className="mb-3 grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors" style={{ backgroundColor: `${color}18`, color }}>
        {tool.formatLabel ? (
          <span className="text-center text-[10px] font-extrabold leading-none">{tool.formatLabel}</span>
        ) : Icon ? (
          <Icon className="h-6 w-6" strokeWidth={2} />
        ) : null}
      </div>

      <h3 className="mb-1 pr-16 text-[15px] font-bold tracking-tight transition-colors group-hover:text-primary">{tool.name}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{tool.desc}</p>
      {!ready && <p className="mt-auto pt-3 text-[11px] font-medium text-amber-700 dark:text-amber-300">This tool is not enabled yet.</p>}
    </Link>
  );
}
