import { Home, Tag, ShoppingBag, User } from "lucide-react";

export type TabId = "inicio" | "promocoes" | "pedidos" | "perfil";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "promocoes", label: "Promoções", icon: Tag },
  { id: "pedidos", label: "Pedidos", icon: ShoppingBag },
  { id: "perfil", label: "Perfil", icon: User },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-0.5 min-w-[60px] py-1 transition-colors"
            >
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? "#f97316" : "#9ca3af" }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? "#f97316" : "#9ca3af" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
