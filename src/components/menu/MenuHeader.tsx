import { Tables } from "@/integrations/supabase/types";
import { Flame, Clock, Bike, ChevronDown, MapPin, Star, Search } from "lucide-react";
import heroFireBg from "@/assets/hero-fire-bg.jpg";

interface MenuHeaderProps {
  config: Tables<"restaurant_config"> | null;
  isOpen: boolean;
  nextOpenInfo: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function MenuHeader({ config, isOpen, nextOpenInfo, searchQuery, onSearchChange }: MenuHeaderProps) {
  const city = (config as any)?.city || "Marília - SP";
  const rating = (config as any)?.rating ?? 4.8;
  const ratingCount = (config as any)?.rating_count || "100+";

  return (
    <>
      {/* Hero Banner — reduced 15% from 260 → 220 */}
      <div className="w-full relative overflow-hidden" style={{ height: 220 }}>
        <img
          src={heroFireBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0000] via-[#3d0000cc] to-[#1a0000aa]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#8b1a0033] via-transparent to-[#ff450022]" />
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full max-w-md mx-auto px-5 flex flex-col items-center justify-center text-center">
          <h1 className="font-serif italic font-bold text-4xl tracking-wide leading-tight"
              style={{
                color: "#d4a017",
                textShadow: "0 0 20px #ff450066, 0 2px 8px #8b1a0088",
              }}>
            Ouro & Brasa
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase mt-1 font-body font-medium"
             style={{ color: "#f5c842cc" }}>
            Pizzaria Artesanal • Forno a Lenha
          </p>

          {/* Location + Rating */}
          <div className="flex items-center gap-3 mt-2.5">
            <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#ffffffcc" }}>
              <MapPin className="w-3 h-3" />
              {city}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5"
                  style={{ backgroundColor: "#d4a01733", color: "#f5c842" }}>
              <Star className="w-3 h-3 fill-current" />
              {rating} ({ratingCount} avaliações)
            </span>
          </div>
        </div>
      </div>

      {/* Info section below hero */}
      <div className="w-full bg-secondary">
        <div className="max-w-md mx-auto px-5 py-4 flex flex-col items-center gap-3">
          {/* Status badge — high contrast */}
          {isOpen ? (
            <span className="inline-flex items-center gap-2 bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md"
                  style={{ borderRadius: 14 }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              Aberto agora
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md"
                  style={{ borderRadius: 14 }}>
              <span className="h-2 w-2 rounded-full bg-red-300" />
              Fechado · {nextOpenInfo || "Abre às 19:00"}
            </span>
          )}

          {/* Delivery pills */}
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 bg-card text-foreground text-xs font-medium px-4 py-2 border border-border shadow-sm"
                    style={{ borderRadius: 14 }}>
              <Bike className="w-3.5 h-3.5" />
              Entrega
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            <button className="inline-flex items-center gap-1.5 bg-card text-foreground text-xs font-medium px-4 py-2 border border-border shadow-sm"
                    style={{ borderRadius: 14 }}>
              <Clock className="w-3.5 h-3.5" />
              Hoje · 40–70 min
            </button>
          </div>

          {/* Minimum order */}
          <p className="text-[11px] text-muted-foreground font-body">
            💰 Pedido mínimo R$ 30,00
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="w-full bg-background border-b">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/50 text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ borderRadius: 14 }}
            />
          </div>
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
          <span className="text-sm font-bold truncate">{config?.name || "Ouro & Brasa"}</span>
        </div>
      </header>
    </>
  );
}
