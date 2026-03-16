import { Tables } from "@/integrations/supabase/types";
import { Flame } from "lucide-react";

interface MenuHeaderProps {
  config: Tables<"restaurant_config"> | null;
}

export function MenuHeader({ config }: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
        {config?.logo_url ? (
          <img
            src={config.logo_url}
            alt={config.name}
            className="w-10 h-10 rounded-xl object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{config?.name || "Restaurante"}</h1>
          {config?.description && (
            <p className="text-xs text-muted-foreground truncate">{config.description}</p>
          )}
        </div>
      </div>
    </header>
  );
}
