import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

interface CategoryBarProps {
  categories: Tables<"categories">[];
  activeCategory: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryBar({ categories, activeCategory, onSelect }: CategoryBarProps) {
  if (categories.length === 0) return null;

  return (
    <div className="sticky top-[73px] z-20 bg-background/80 backdrop-blur-lg border-b">
      <div className="max-w-md mx-auto px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
            activeCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
