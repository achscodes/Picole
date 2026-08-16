"use client";

import { forwardRef } from "react";
import { Search, X } from "lucide-react";

export const SearchBar = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }
>(function SearchBar({ value, onChange, placeholder = "Search products..." }, ref) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3">
      <Search className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="shrink-0 rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--cream-strong)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
