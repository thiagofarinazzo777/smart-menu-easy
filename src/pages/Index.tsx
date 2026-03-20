import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MenuHeader } from "@/components/menu/MenuHeader";
import { CategoryBar } from "@/components/menu/CategoryBar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { CartDrawer } from "@/components/menu/CartDrawer";
import { CartFab } from "@/components/menu/CartFab";
import { BottomNav, TabId } from "@/components/menu/BottomNav";
import { CustomerAuthModal } from "@/components/menu/CustomerAuthModal";
import { Skeleton } from "@/components/ui/skeleton";
import { User, LogOut } from "lucide-react";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("inicio");
  const [authOpen, setAuthOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

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

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";

  return (
    <div className="min-h-screen bg-background pb-16">
      <MenuHeader config={config ?? null} />

      {/* User bar */}
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-end gap-2">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground truncate max-w-[150px]">
              Olá, {displayName}
            </span>
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            <User className="w-4 h-4" />
            Entrar
          </button>
        )}
      </div>

      {activeTab === "inicio" && (
        <>
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
        </>
      )}

      {activeTab === "promocoes" && (
        <main className="max-w-md mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground text-sm">Nenhuma promoção ativa no momento.</p>
        </main>
      )}

      {activeTab === "pedidos" && (
        <main className="max-w-md mx-auto px-4 py-8 text-center">
          {user ? (
            <p className="text-muted-foreground text-sm">Você ainda não tem pedidos.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">Faça login para ver seus pedidos.</p>
              <button onClick={() => setAuthOpen(true)} className="text-primary font-semibold text-sm">
                Entrar
              </button>
            </div>
          )}
        </main>
      )}

      {activeTab === "perfil" && (
        <main className="max-w-md mx-auto px-4 py-8">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{profile?.full_name || "Cliente"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="w-full text-center text-sm text-destructive font-medium py-3 border rounded-xl"
              >
                Sair da conta
              </button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-muted-foreground text-sm">Faça login para acessar seu perfil.</p>
              <button onClick={() => setAuthOpen(true)} className="text-primary font-semibold text-sm">
                Entrar ou Criar conta
              </button>
            </div>
          )}
        </main>
      )}

      <CartFab onClick={() => setCartOpen(true)} />
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        whatsappNumber={config?.whatsapp_number ?? ""}
      />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <CustomerAuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default Index;
