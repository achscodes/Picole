"use client";

import { CATEGORIES } from "@/data/catalog";
import { FilterPill } from "@/components/ui/FilterPill";
import type { CategoryId } from "@/types";

export function PosCategoryTabs({
  activeId,
  onSelect,
}: {
  activeId: CategoryId;
  onSelect: (id: CategoryId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => (
        <FilterPill
          key={category.id}
          active={activeId === category.id}
          onSelect={() => onSelect(category.id)}
        >
          {category.name}
        </FilterPill>
      ))}
    </div>
  );
}
