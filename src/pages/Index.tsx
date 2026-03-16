import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MenuHeader } from "@/components/menu/MenuHeader";
import { CategoryBar } from "@/components/menu/CategoryBar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { CartDrawer } from "@/components/menu/CartDrawer";
import { CartFab } from "@/components/menu/CartFab";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["restaurant-config"],
    queryFn: async () => {
      const { data } = await supabase.from("restaurant_config").select("*").limit(1).single();
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .order("created_at");
      return data ?? [];
    },
  });

  const filteredItems = activeCategory
    ? menuItems.filter((i) => i.category_id === activeCategory)
    : menuItems;

  // Group items by category for display
  const groupedItems = activeCategory
    ? [{ category: categories.find((c) => c.id === activeCategory), items: filteredItems }]
    : categories
        .map((cat) => ({
          category: cat,
          items: filteredItems.filter((i) => i.category_id === cat.id),
        }))
        .filter((g) => g.items.length > 0)
        .concat(
          filteredItems.filter((i) => !i.category_id).length > 0
            ? [{ category: null, items: filteredItems.filter((i) => !i.category_id) }]
            : []
        );

  return (
    <div className="min-h-screen bg-background">
      <MenuHeader config={config ?? null} />
      <CategoryBar
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      <main className="max-w-md mx-auto px-4 py-4 pb-24 space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-2xl border">
                <Skeleton className="w-24 h-24 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Nenhum item disponível no momento.
          </p>
        ) : (
          groupedItems.map((group, gi) => (
            <section key={group.category?.id ?? "uncategorized"}>
              {group.category && !activeCategory && (
                <h2 className="text-base font-bold mb-3">{group.category.name}</h2>
              )}
              <div className="space-y-3">
                {group.items.map((item, i) => (
                  <MenuItemCard key={item.id} item={item} index={gi * 10 + i} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <CartFab onClick={() => setCartOpen(true)} />
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        whatsappNumber={config?.whatsapp_number ?? ""}
      />
    </div>
  );
};

export default Index;
