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
      className="group relative flex flex-col p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      style={
        {
          "--hover-color": color,
        } as React.CSSProperties
      }
    >
      {/* Badge */}
      {tool.badge && (
        <span
          className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${
            tool.badge === "AI"
              ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
              : tool.badge === "NEW"
              ? "gradient-primary text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {tool.badge}
        </span>
      )}

      {/* Icon / Format label */}
      <div
        className="w-12 h-12 rounded-xl grid place-items-center mb-3 transition-colors duration-200 shrink-0"
        style={{
          backgroundColor: color + "18",
          color: color,
        }}
      >
        {tool.formatLabel ? (
          <span className="text-[10px] font-extrabold tracking-tight leading-none text-center">
            {tool.formatLabel}
          </span>
        ) : Icon ? (
          <Icon className="w-6 h-6" strokeWidth={2} />
        ) : null}
      </div>

      {/* Title & description */}
      <h3 className="text-[15px] font-bold tracking-tight mb-1 group-hover:text-primary transition-colors">
        {tool.name}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {tool.desc}
      </p>
    </Link>
  );
}