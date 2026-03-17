import { Tables } from "@/integrations/supabase/types";
import { Flame } from "lucide-react";

interface MenuHeaderProps {
  config: Tables<"restaurant_config"> | null;
}

export function MenuHeader({ config }: MenuHeaderProps) {
  return (
    <>
      {/* Hero Banner */}
      <div className="w-full h-[180px] relative overflow-hidden bg-gradient-to-br from-[hsl(0,0%,10%)] via-[hsl(15,80%,25%)] to-[hsl(30,90%,45%)]">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(25,90%,50%,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(0,70%,30%,0.4),transparent_60%)]" />
        
        <div className="relative z-10 h-full max-w-md mx-auto px-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-7 h-7 text-[hsl(30,90%,55%)]" />
            <h1 className="text-2xl font-display font-extrabold tracking-tight text-white">
              Ouro & Brasa
            </h1>
          </div>
          <p className="text-sm text-white/70 font-body leading-relaxed max-w-[280px]">
            Feita com fogo de verdade, entregue com amor de sempre
          </p>
        </div>
      </div>

      {/* Sticky nav bar */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          {config?.logo_url ? (
            <img
              src={config.logo_url}
              alt={config.name}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          <span className="text-sm font-bold truncate">{config?.name || "Restaurante"}</span>
        </div>
      </header>
    </>
  );
}
