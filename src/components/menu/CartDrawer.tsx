import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappNumber: string;
}

export function CartDrawer({ open, onOpenChange, whatsappNumber }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const { toast } = useToast();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  const handleOrder = () => {
    if (!customerName.trim()) {
      toast({ title: "Informe seu nome", variant: "destructive" });
      return;
    }
    if (!customerAddress.trim()) {
      toast({ title: "Informe seu endereço", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Carrinho vazio", variant: "destructive" });
      return;
    }

    const itemLines = items
      .map(
        (ci) =>
          `- ${ci.item.name} x${ci.quantity} - ${formatPrice(ci.item.price * ci.quantity)}`
      )
      .join("\n");

    const message = `Novo pedido de ${customerName}:\n\n${itemLines}\n\nTotal: ${formatPrice(total)}\nEndereço: ${customerAddress}`;

    const phone = whatsappNumber.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    clearCart();
    setCustomerName("");
    setCustomerAddress("");
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Seu Pedido
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 flex-1 overflow-y-auto space-y-3">
          <AnimatePresence>
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Seu carrinho está vazio
              </p>
            ) : (
              items.map((ci) => (
                <motion.div
                  key={ci.item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ci.item.name}</p>
                    <p className="text-xs text-primary font-bold">
                      {formatPrice(ci.item.price * ci.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-background border flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{ci.quantity}</span>
                    <button
                      onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-background border flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(ci.item.id)}
                      className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {items.length > 0 && (
            <div className="space-y-3 pt-3 border-t">
              <Input
                placeholder="Seu nome"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="Endereço de entrega"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
          )}
        </div>

        <DrawerFooter>
          {items.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg text-primary">{formatPrice(total)}</span>
              </div>
              <Button onClick={handleOrder} size="lg" className="w-full text-base font-semibold">
                Finalizar no WhatsApp
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
