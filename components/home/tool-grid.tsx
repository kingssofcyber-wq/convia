"use client";

import * as React from "react";
import { Search, ArrowRight } from "lucide-react";
import { categoryLabels, tools, type ToolCategory } from "@/lib/tools-data";
import { ToolCard } from "@/components/home/tool-card";

type TabKey = ToolCategory | "all";
const tabOrder: TabKey[] = ["all", "convert", "organize", "edit", "security", "ai"];

export function ToolGrid() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("all");
  const [query, setQuery] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);

  // फ़िल्टर लॉजिक (सर्च और कैटेगरी)
  const filtered = React.useMemo(() => {
    let list = tools;
    
    // कैटेगरी फ़िल्टर
    if (activeTab !== "all") {
      list = list.filter((t) => t.category === activeTab);
    }
    
    // सर्च फ़िल्टर
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((t) => 
        t.name.toLowerCase().includes(q) || 
        t.desc.toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [activeTab, query]);

  // अगर "All" टैब पर हैं, सर्च खाली है, और showAll फ़ॉल्स है, तो सिर्फ 8 दिखाएँ
  const displayedTools = (activeTab === "all" && !query.trim() && !showAll) 
    ? filtered.slice(0, 8) 
    : filtered;

  return (
    <section className="container max-w-6xl mx-auto px-4 pb-20 relative z-10">
      
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-10 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-violet-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
        <div className="relative flex items-center bg-background border border-border/60 rounded-2xl shadow-lg p-2">
          <Search className="w-5 h-5 text-muted-foreground ml-4" />
          <input 
            type="text" 
            placeholder="Search for PDF tools..." 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowAll(false); // सर्च करते ही showAll रीसेट हो जाए
            }}
            className="w-full bg-transparent px-4 py-2 text-base outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex flex-wrap justify-center items-center gap-1.5 p-1.5 bg-background border border-border/60 shadow-sm rounded-full">
          {tabOrder.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setShowAll(false); // टैब बदलने पर showAll रीसेट हो जाए
              }}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {categoryLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {displayedTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">No tools found for "{query}".</p>
        </div>
      )}

      {/* See All Button */}
      {activeTab === "all" && !query.trim() && !showAll && filtered.length > 8 && (
        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => setShowAll(true)}
            className="group flex items-center gap-2 bg-background border border-border/80 px-8 py-3 rounded-full text-sm font-bold text-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
          >
            See all {filtered.length} tools
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

    </section>
  );
}