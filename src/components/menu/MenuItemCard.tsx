import { Tables } from "@/integrations/supabase/types";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";

interface MenuItemCardProps {
  item: Tables<"menu_items">;
  index: number;
  disabled?: boolean;
}

export function MenuItemCard({ item, index, disabled }: MenuItemCardProps) {
  const { addItem } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex gap-3 p-3 rounded-2xl bg-card border hover:shadow-md transition-shadow"
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-24 h-24 rounded-xl bg-secondary flex-shrink-0 flex items-center justify-center">
          <span className="text-3xl">🍔</span>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-primary text-sm">
            {formatPrice(item.price)}
          </span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => addItem(item)}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
