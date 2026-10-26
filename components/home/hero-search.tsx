"use client";

import * as React from "react";
import { Search } from "lucide-react";

interface HeroSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function HeroSearch({ value, onChange }: HeroSearchProps) {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search any tool — compress, merge, edit PDF…"
        className="w-full pl-14 pr-5 py-4 rounded-2xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-[15px] shadow-sm"
      />
    </div>
  );
}