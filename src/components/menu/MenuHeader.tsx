import { Tables } from "@/integrations/supabase/types";
import { Clock, Bike, ChevronDown, MapPin, Star, Search } from "lucide-react";
import heroFireBg from "@/assets/hero-fire-bg.jpg";
import { ReactNode } from "react";

interface MenuHeaderProps {
  config: Tables<"restaurant_config"> | null;
  isOpen: boolean;
  nextOpenInfo: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  themeToggle?: ReactNode;
  greeting?: string;
}

export function MenuHeader({ config, isOpen, nextOpenInfo, searchQuery, onSearchChange, themeToggle, greeting }: MenuHeaderProps) {
  const city = config?.city || "Marília - SP";
  const rating = config?.rating ?? 4.8;
  const ratingCount = config?.rating_count || "100+";
  const deliveryTime = (config as any)?.delivery_time || "40-70 min";
  const minOrder = (config as any)?.min_order ?? 30;

  return (
    <>
      {/* Banner */}
      <div className="relative w-full">
        <div className="w-full relative overflow-hidden" style={{ height: 180 }}>
          <img src={heroFireBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0000] via-[#3d0000cc] to-[#1a0000aa]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#8b1a0033] via-transparent to-[#ff450022]" />
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
            }}
          />
          {themeToggle && (
            <div className="absolute top-3 right-3 z-20">
              {themeToggle}
            </div>
          )}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-5">
            <h1
              className="font-serif italic font-bold text-3xl tracking-wide leading-tight"
              style={{ color: "#d4a017", textShadow: "0 0 20px #ff450066, 0 2px 8px #8b1a0088" }}
            >
              Ouro & Brasa
            </h1>
            <p className="text-[10px] tracking-[0.25em] uppercase mt-1 font-body font-medium" style={{ color: "#f5c842cc" }}>
              Pizzaria Artesanal • Forno a Lenha
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant info card — compact */}
      <div className="max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-4 pt-3 pb-1">
        <div className="bg-card rounded-2xl shadow-sm border border-border px-5 py-3 flex flex-col items-center gap-1">
          <h2 className="text-lg font-bold text-card-foreground text-center">{config?.name || "Ouro & Brasa"}</h2>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {city}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <Star className="w-3.5 h-3.5 fill-current" />
            {rating} ({ratingCount} avaliações)
          </span>
          {isOpen ? (
            <span className="inline-flex items-center gap-2 text-xs font-bold text-green-600 dark:text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Aberto agora
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs font-bold text-destructive">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              Fechado · {nextOpenInfo || "Abre às 19:00"}
            </span>
          )}
        </div>
      </div>

      {/* Delivery info card */}
      <div className="max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-2">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2">
            <button className="inline-flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-4 py-2 rounded-xl border border-border shadow-sm">
              <Bike className="w-3.5 h-3.5 text-primary" />
              Entrega
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-4 py-2 rounded-xl border border-border shadow-sm">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Hoje · {deliveryTime}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">💰 Pedido mínimo R$ {Number(minOrder).toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      {/* Greeting + Search bar */}
      <div className="max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-2">
        {greeting && (
          <p className="text-sm font-medium text-foreground mb-2">{greeting}</p>
        )}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/50 text-foreground placeholder:text-muted-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>
    </>
  );
}
