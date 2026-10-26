"use client";

import * as React from "react";
import { categoryLabels, tools, type ToolCategory } from "@/lib/tools-data";
import { ToolCard } from "@/components/home/tool-card";
import { HeroSearch } from "@/components/home/hero-search";

type TabKey = ToolCategory | "all" | "popular";

const tabOrder: TabKey[] = [
  "all",
  "popular",
  "organize",
  "convert",
  "optimize",
  "edit",
  "security",
  "ai",
];

export function ToolGrid() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("all");
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    let list = tools;

    if (activeTab === "popular") {
      list = list.filter((t) => t.popular);
    } else if (activeTab !== "all") {
      list = list.filter((t) => t.category === activeTab);
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.id.includes(q) ||
          (t.formatLabel?.toLowerCase().includes(q) ?? false)
      );
    }

    return list;
  }, [activeTab, query]);

  return (
    <section id="pdf-tools" className="w-full">
      {/* Search */}
      <div className="mb-8">
        <HeroSearch value={query} onChange={setQuery} />
      </div>

      {/* Sub-tabs */}
      <div className="overflow-x-auto scrollbar-hide mb-6">
        <div className="flex gap-2 min-w-max justify-center px-1">
          {tabOrder.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "gradient-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {categoryLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-center text-sm text-muted-foreground">
        <span className="font-bold text-foreground">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "tool" : "tools"} found
        {query && (
          <>
            {" "}
            for <span className="font-semibold text-foreground">"{query}"</span>
          </>
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-lg font-bold mb-2">No tools found</h3>
          <p className="text-muted-foreground text-sm">
            Try a different keyword or category.
          </p>
        </div>
      )}
    </section>
  );
}