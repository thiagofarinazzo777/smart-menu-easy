import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, ShoppingBag, MapPin, Loader2, Check, Bike, PersonStanding, CreditCard, Banknote, QrCode, Pencil, Tag, X, Copy, Share2, Clock, MessageCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { formatBrazilianPhone, isValidBrazilianPhone } from "@/lib/phone-mask";
import { generatePixPayload } from "@/lib/pix-payload";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappNumber: string;
  pixKey?: string;
  restaurantName?: string;
  restaurantCity?: string;
}

type Step = "cart" | "delivery" | "confirmation" | "payment";
type DeliveryType = "entrega" | "retirada";
type PaymentType = "pix" | "dinheiro" | "credito" | "debito" | null;

interface ItemEdit {
  id: string;
  quantity: number;
  observation: string;
}

export function CartDrawer({ open, onOpenChange, whatsappNumber, pixKey = "", restaurantName = "Ouro & Brasa", restaurantCity = "Sao Paulo" }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [loadingCep, setLoadingCep] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>(null);
  const [troco, setTroco] = useState("");
  const [showPix, setShowPix] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [cupom, setCupom] = useState("");
  const [showCupom, setShowCupom] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [editingItem, setEditingItem] = useState<ItemEdit | null>(null);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [neighborhoodNotFound, setNeighborhoodNotFound] = useState(false);
  const [address, setAddress] = useState({
    cep: "", rua: "", numero: "", bairro: "",
    complemento: "", referencia: "", cidade: "", estado: "",
  });
  const { toast } = useToast();

  const { data: deliveryZones = [] } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const { data } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("is_active", true)
        .order("neighborhood");
      return data ?? [];
    },
  });

  const orderTotal = total + (deliveryType === "entrega" && deliveryFee !== null ? deliveryFee : 0);

  const pixPayloadCode = useMemo(() => {
    if (!pixKey || orderTotal <= 0) return pixKey || "";
    return generatePixPayload({
      pixKey,
      merchantName: restaurantName,
      merchantCity: restaurantCity,
      amount: orderTotal,
      txId: crypto.randomUUID().replace(/-/g, "").substring(0, 25),
    });
  }, [pixKey, orderTotal, restaurantName, restaurantCity]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  const handleClose = () => {
    setStep("cart");
    setShowPix(false);
    setEditingItem(null);
    onOpenChange(false);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixPayloadCode).then(() => {
      setPixCopied(true);
      toast({ title: "Código PIX copiado!" });
      setTimeout(() => setPixCopied(false), 3000);
    });
  };

  const sharePixCode = () => {
    if (navigator.share) {
      navigator.share({ title: "Código PIX", text: pixPayloadCode });
    } else {
      copyPixCode();
    }
  };

  const handleBairroChange = (value: string) => {
    setAddress((prev) => ({ ...prev, bairro: value }));
    if (!value.trim()) {
      setDeliveryFee(null);
      setNeighborhoodNotFound(false);
      return;
    }
    const normalized = value.trim().toLowerCase();
    const zone = deliveryZones.find(
      (z: any) => z.neighborhood.toLowerCase() === normalized
    );
    if (zone) {
      setDeliveryFee(Number(zone.fee));
      setNeighborhoodNotFound(false);
    } else {
      setDeliveryFee(null);
      setNeighborhoodNotFound(true);
    }
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) { toast({ title: "CEP não encontrado", variant: "destructive" }); return; }
      setAddress((prev) => ({ ...prev, rua: data.logradouro || "", cidade: data.localidade || "", estado: data.uf || "" }));
      if (data.bairro) {
        handleBairroChange(data.bairro);
        setAddress((prev) => ({ ...prev, bairro: data.bairro }));
      }
    } catch { toast({ title: "Erro ao buscar CEP", variant: "destructive" }); }
    finally { setLoadingCep(false); }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 8);
    const formatado = valor.length > 5 ? `${valor.slice(0, 5)}-${valor.slice(5)}` : valor;
    setAddress((prev) => ({ ...prev, cep: formatado }));
    if (valor.length === 8) buscarCep(valor);
  };

  const openEditItem = (id: string, quantity: number) => {
    setEditingItem({ id, quantity, observation: observations[id] || "" });
  };

  const saveEditItem = () => {
    if (!editingItem) return;
    updateQuantity(editingItem.id, editingItem.quantity);
    setObservations((prev) => ({ ...prev, [editingItem.id]: editingItem.observation }));
    setEditingItem(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPhone(formatBrazilianPhone(e.target.value));
  };

  const handleGoToDelivery = () => {
    if (!customerName.trim()) { toast({ title: "Informe seu nome", variant: "destructive" }); return; }
    if (!isValidBrazilianPhone(customerPhone)) { toast({ title: "Informe um telefone válido", description: "Ex: (11) 99999-9999", variant: "destructive" }); return; }
    if (items.length === 0) { toast({ title: "Carrinho vazio", variant: "destructive" }); return; }
    setStep("delivery");
  };

  const handleGoToConfirmation = () => {
    if (!deliveryType) { toast({ title: "Selecione o tipo de entrega", variant: "destructive" }); return; }
    if (deliveryType === "entrega" && (!address.rua || !address.numero || !address.bairro)) {
      toast({ title: "Preencha o endereço completo", variant: "destructive" }); return;
    }
    if (deliveryType === "entrega" && neighborhoodNotFound) {
      toast({ title: "Entrega indisponível", description: "Não entregamos nesse bairro.", variant: "destructive" }); return;
    }
    setStep("confirmation");
  };

  const handleSendOrder = () => {
    if (!paymentType) { toast({ title: "Selecione a forma de pagamento", variant: "destructive" }); return; }
    if (paymentType === "pix") { setShowPix(true); return; }
    sendToWhatsApp();
  };

  const sendToWhatsApp = () => {
    const itemLines = items.map((ci) => {
      const obs = observations[ci.item.id];
      return `${ci.quantity}x ${ci.item.name} - ${formatPrice(ci.item.price * ci.quantity)}${obs ? ` (Obs: ${obs})` : ""}`;
    }).join("\n");

    const enderecoInfo = deliveryType === "entrega"
      ? `${address.rua}, ${address.numero} - ${address.bairro}, ${address.cidade} - ${address.estado}${address.complemento ? ` (${address.complemento})` : ""}${address.referencia ? `\nReferência: ${address.referencia}` : ""}`
      : "Retirada no estabelecimento";

    const feeText = deliveryType === "entrega" && deliveryFee !== null && deliveryFee > 0 ? formatPrice(deliveryFee) : "Grátis";
    const pagamentoInfo = paymentType === "pix" ? "PIX" : paymentType === "dinheiro" ? `Dinheiro${troco ? ` (Troco para R$ ${troco})` : ""}` : paymentType === "credito" ? "Cartão de crédito" : "Cartão de débito";

    const message = `🛒 *Novo Pedido!*\n\n*Cliente:* ${customerName}\n*Telefone:* ${customerPhone}\n\n*Itens:*\n${itemLines}\n\n*Subtotal:* ${formatPrice(total)}\n*Entrega:* ${feeText}\n*Total:* ${formatPrice(orderTotal)}${cupom ? `\n*Cupom:* ${cupom}` : ""}\n\n*Entrega:* ${enderecoInfo}\n*Pagamento:* ${pagamentoInfo}`;

    const phone = whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");

    clearCart();
    setCustomerName(""); setCustomerPhone(""); setTroco(""); setPaymentType(null);
    setShowPix(false); setCupom(""); setObservations({});
    setAddress({ cep: "", rua: "", numero: "", bairro: "", complemento: "", referencia: "", cidade: "", estado: "" });
    setStep("cart");
    setDeliveryType(null);
    onOpenChange(false);
  };

  const sendPixWhatsApp = () => {
    const itemLines = items.map((ci) => {
      const obs = observations[ci.item.id];
      return `- ${ci.item.name} x${ci.quantity} — ${formatPrice(ci.item.price * ci.quantity)}${obs ? ` (Obs: ${obs})` : ""}`;
    }).join("\n");

    const enderecoInfo = deliveryType === "entrega"
      ? `${address.rua}, ${address.numero} - ${address.bairro}, ${address.cidade} - ${address.estado}${address.complemento ? ` (${address.complemento})` : ""}${address.referencia ? `\nRef: ${address.referencia}` : ""}`
      : "Retirada no estabelecimento";

    const entregaTipo = deliveryType === "entrega" ? "Entrega" : "Retirada";

    const message = `Olá! Acabei de realizar o pagamento via Pix. Seguem os detalhes do meu pedido:\n\n👤 Nome: ${customerName}\n📦 Itens:\n${itemLines}\n\n💰 Total: ${formatPrice(orderTotal)}\n🛵 Entrega: ${entregaTipo}\n${deliveryType === "entrega" ? `📍 Endereço: ${enderecoInfo}\n` : ""}\n✅ Pagamento: Pix realizado`;

    const phone = whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");

    clearCart();
    setCustomerName(""); setCustomerPhone(""); setTroco(""); setPaymentType(null);
    setShowPix(false); setCupom(""); setObservations({});
    setAddress({ cep: "", rua: "", numero: "", bairro: "", complemento: "", referencia: "", cidade: "", estado: "" });
    setStep("cart");
    setDeliveryType(null);
    onOpenChange(false);
  };

  const StepIndicator = () => {
    const steps = [{ label: "Entrega", num: 1 }, { label: "Confirmação", num: 2 }, { label: "Pagamento", num: 3 }];
    const currentNum = step === "delivery" ? 1 : step === "confirmation" ? 2 : 3;
    return (
      <div className="flex items-center justify-center mb-4">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentNum >= s.num ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
                {currentNum > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs mt-1 ${currentNum >= s.num ? "text-primary font-medium" : "text-gray-400"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`w-14 h-0.5 mb-4 mx-1 ${currentNum > s.num ? "bg-primary" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="p-0 gap-0 w-full h-full max-w-full max-h-full m-0 rounded-none sm:rounded-2xl sm:max-w-md sm:h-[92vh] sm:max-h-[92vh] flex flex-col overflow-hidden">

        {/* PIX Screen */}
        {showPix && (
          <div className="absolute inset-0 z-50 bg-background flex flex-col p-6 overflow-y-auto">
            <p className="text-center font-bold text-base uppercase tracking-widest text-muted-foreground mb-6">PAGAMENTO</p>
            <div className="flex justify-center mb-4">
              <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-2 w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Pedido aguardando pagamento</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Copie o código Pix Copia e Cola abaixo para pagar:
            </p>
            <div className="border-2 border-dashed border-border rounded-xl p-3 flex items-center gap-2 mb-2">
              <p className="flex-1 text-xs text-muted-foreground truncate font-mono">{pixPayloadCode}</p>
              <button onClick={copyPixCode} className={`p-2 rounded-lg transition-colors ${pixCopied ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                {pixCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 text-center mb-2">
              <p className="text-xs text-muted-foreground mb-1">Total a pagar</p>
              <p className="font-bold text-primary text-2xl">{formatPrice(total)}</p>
            </div>
            <p className="text-xs text-muted-foreground text-center mb-6">
              Após o pagamento, envie seu pedido pelo WhatsApp.
            </p>
            <Button onClick={copyPixCode} size="lg" className="w-full font-semibold mb-3">
              <Copy className="w-4 h-4 mr-2" />
              {pixCopied ? "Copiado!" : "Copiar código PIX"}
            </Button>
            <button onClick={sharePixCode} className="w-full text-center text-primary font-semibold text-sm mb-4">
              <span className="flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Compartilhar código
              </span>
            </button>
            <Button onClick={() => { setShowPix(false); sendPixWhatsApp(); }} size="lg" className="w-full font-semibold bg-green-600 hover:bg-green-700 text-white mb-2">
              <MessageCircle className="w-5 h-5 mr-2" />
              📲 Enviar pedido para o restaurante
            </Button>
            <Button variant="ghost" onClick={() => setShowPix(false)} className="w-full text-muted-foreground">
              Voltar
            </Button>
          </div>
        )}

        {/* Edit Item Screen */}
        {editingItem && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Editar item</h2>
              <button onClick={() => setEditingItem(null)}><X className="w-5 h-5" /></button>
            </div>
            {items.find(ci => ci.item.id === editingItem.id) && (
              <div className="mb-4">
                <p className="font-semibold">{items.find(ci => ci.item.id === editingItem.id)?.item.name}</p>
                <p className="text-primary font-bold">{formatPrice((items.find(ci => ci.item.id === editingItem.id)?.item.price || 0) * editingItem.quantity)}</p>
              </div>
            )}
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => setEditingItem(prev => prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null)} className="w-8 h-8 rounded-full border-2 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
              <span className="text-lg font-bold">{editingItem.quantity}</span>
              <button onClick={() => setEditingItem(prev => prev ? { ...prev, quantity: prev.quantity + 1 } : null)} className="w-8 h-8 rounded-full border-2 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
            </div>
            <label className="text-sm font-medium mb-1">Observação</label>
            <Textarea placeholder="Ex: sem cebola, mais molho, bem passado..." value={editingItem.observation} onChange={(e) => setEditingItem(prev => prev ? { ...prev, observation: e.target.value } : null)} className="mb-4" rows={3} />
            <Button onClick={saveEditItem} className="w-full">Salvar</Button>
          </div>
        )}

        {/* Header */}
        <div className="px-4 pt-4 pb-0 flex-shrink-0">
          {step === "cart" ? (
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" /> Sua Sacola
              </h2>
              <div className="flex items-center gap-3">
                {items.length > 0 && (
                  <button onClick={() => clearCart()} className="text-xs text-muted-foreground">LIMPAR</button>
                )}
                <button onClick={handleClose}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
            </div>
          ) : (
            <div className="mb-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Checkout</h2>
                <button onClick={handleClose}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <StepIndicator />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">

          {/* CART */}
          {step === "cart" && (
            <div className="space-y-3">
              <AnimatePresence>
                {items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Seu carrinho está vazio</p>
                ) : (
                  items.map((ci) => (
                    <motion.div key={ci.item.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="border rounded-xl p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-bold text-primary">{ci.quantity}x </span>
                              <span className="text-sm font-semibold">{ci.item.name}</span>
                            </div>
                            <span className="text-sm font-bold ml-2">{formatPrice(ci.item.price * ci.quantity)}</span>
                          </div>
                          {observations[ci.item.id] && (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{observations[ci.item.id]}"</p>
                          )}
                        </div>
                        {ci.item.image_url && (
                          <img src={ci.item.image_url} alt={ci.item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => openEditItem(ci.item.id, ci.quantity)} className="text-xs text-primary font-medium">Editar</button>
                        <button onClick={() => removeItem(ci.item.id)} className="text-xs text-muted-foreground">Remover</button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {items.length > 0 && (
                <>
                  <button onClick={() => onOpenChange(false)} className="w-full text-center text-primary font-semibold text-sm py-2">
                    + ADICIONAR MAIS ITENS
                  </button>
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(total)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Taxa de entrega</span><span className="text-muted-foreground text-xs">Calculada na entrega</span></div>
                    <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>{formatPrice(total)}</span></div>
                  </div>
                  {!showCupom ? (
                    <button onClick={() => setShowCupom(true)} className="w-full flex items-center gap-3 p-3 border rounded-xl text-sm">
                      <Tag className="w-4 h-4 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Tem um cupom?</p>
                        <p className="text-xs text-muted-foreground">Clique e insira o código</p>
                      </div>
                      <span className="ml-auto text-muted-foreground">›</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <Input placeholder="Código do cupom" value={cupom} onChange={(e) => setCupom(e.target.value)} />
                      <Button variant="outline" size="sm" onClick={() => { setShowCupom(false); setCupom(""); }}>Cancelar</Button>
                    </div>
                  )}
                  <Input placeholder="Seu nome *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <Input placeholder="Telefone * (11) 99999-9999" value={customerPhone} onChange={handlePhoneChange} inputMode="numeric" />
                </>
              )}
            </div>
          )}

          {/* DELIVERY */}
          {step === "delivery" && (
            <div className="space-y-3">
              <div onClick={() => setDeliveryType("entrega")} className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === "entrega" ? "border-primary" : "border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bike className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-sm">Receber no seu endereço</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${deliveryType === "entrega" ? "border-primary" : "border-gray-300"}`}>
                    {deliveryType === "entrega" && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </div>
                </div>
              </div>

              {deliveryType === "entrega" && (
                <div className="space-y-2 pl-1">
                  <div className="relative">
                    <Input placeholder="CEP *" value={address.cep} onChange={handleCepChange} maxLength={9} inputMode="numeric" />
                    {loadingCep && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-muted-foreground" />}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Rua *" value={address.rua} onChange={(e) => setAddress({ ...address, rua: e.target.value })} className="flex-1" />
                    <Input placeholder="Nº *" value={address.numero} onChange={(e) => setAddress({ ...address, numero: e.target.value })} className="w-20" />
                  </div>
                  <Input placeholder="Bairro *" value={address.bairro} onChange={(e) => handleBairroChange(e.target.value)} onBlur={() => handleBairroChange(address.bairro)} />
                  {neighborhoodNotFound && address.bairro.trim() && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                      <p className="text-xs text-destructive">Entrega indisponível para este bairro.</p>
                    </div>
                  )}
                  <Input placeholder="Complemento" value={address.complemento} onChange={(e) => setAddress({ ...address, complemento: e.target.value })} />
                  <Input placeholder="Ponto de referência" value={address.referencia} onChange={(e) => setAddress({ ...address, referencia: e.target.value })} />
                  <div className="flex gap-2">
                    <Input placeholder="Cidade *" value={address.cidade} onChange={(e) => setAddress({ ...address, cidade: e.target.value })} className="flex-1" />
                    <Input placeholder="UF *" value={address.estado} onChange={(e) => setAddress({ ...address, estado: e.target.value })} className="w-20" />
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    {deliveryFee !== null ? (
                      <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : "font-semibold"}>{deliveryFee === 0 ? "Grátis" : formatPrice(deliveryFee)}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Informe o bairro</span>
                    )}
                  </div>
                </div>
              )}

              <div onClick={() => setDeliveryType("retirada")} className={`p-4 rounded-xl border-2 cursor-pointer transition-colors flex items-center justify-between ${deliveryType === "retirada" ? "border-primary" : "border-gray-200"}`}>
                <div className="flex items-center gap-3">
                  <PersonStanding className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">Retirar no estabelecimento</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${deliveryType === "retirada" ? "border-primary" : "border-gray-300"}`}>
                  {deliveryType === "retirada" && <div className="w-3 h-3 rounded-full bg-primary" />}
                </div>
              </div>
            </div>
          )}

          {/* CONFIRMATION */}
          {step === "confirmation" && (
            <div className="space-y-4">
              <div className="border rounded-xl p-4 space-y-3">
                <p className="font-bold text-sm">Informações para entrega</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">👤</div>
                  <div>
                    <p className="font-semibold">{customerName}</p>
                    <p className="text-sm text-muted-foreground">{customerPhone}</p>
                  </div>
                </div>
                {deliveryType === "entrega" ? (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">{address.rua}, {address.numero}</p>
                      <p className="text-sm text-muted-foreground">{address.bairro}, {address.cidade} - {address.estado}</p>
                      {address.complemento && <p className="text-sm text-muted-foreground">{address.complemento}</p>}
                      {address.referencia && <p className="text-sm text-muted-foreground">Ref: {address.referencia}</p>}
                    </div>
                    <button onClick={() => setStep("delivery")} className="text-primary flex-shrink-0"><Pencil className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-primary">Retirada no estabelecimento</p>
                )}
              </div>
              <div className="border rounded-xl p-4 space-y-2">
                {items.map((ci) => (
                  <div key={ci.item.id} className="flex justify-between text-sm">
                    <div>
                      <span><span className="font-bold">{ci.quantity}x</span> {ci.item.name}</span>
                      {observations[ci.item.id] && <p className="text-xs text-muted-foreground italic">"{observations[ci.item.id]}"</p>}
                    </div>
                    <span className="font-medium ml-2">{formatPrice(ci.item.price * ci.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(total)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Entrega</span><span className={deliveryType === "entrega" && deliveryFee && deliveryFee > 0 ? "font-semibold" : "text-green-600"}>{deliveryType === "retirada" || !deliveryFee || deliveryFee === 0 ? "Grátis" : formatPrice(deliveryFee)}</span></div>
                  {cupom && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cupom</span><span className="text-green-600">{cupom}</span></div>}
                  <div className="flex justify-between font-bold"><span>Total</span><span>{formatPrice(orderTotal)}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT */}
          {step === "payment" && (
            <div className="space-y-4">
              <p className="font-semibold text-sm text-muted-foreground">Pagar online</p>
              <div onClick={() => setPaymentType("pix")} className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 ${paymentType === "pix" ? "border-primary bg-orange-50" : "border-gray-200"}`}>
                <QrCode className="w-5 h-5 text-primary" />
                <span className="font-semibold">PIX</span>
                {paymentType === "pix" && <Check className="w-4 h-4 text-primary ml-auto" />}
              </div>
              <p className="font-semibold text-sm text-muted-foreground">Pagar na entrega</p>
              <div onClick={() => setPaymentType("dinheiro")} className={`p-4 rounded-xl border-2 cursor-pointer ${paymentType === "dinheiro" ? "border-primary bg-orange-50" : "border-gray-200"}`}>
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Dinheiro</span>
                  {paymentType === "dinheiro" && <Check className="w-4 h-4 text-primary ml-auto" />}
                </div>
                {paymentType === "dinheiro" && (
                  <Input placeholder="Troco para quanto? (opcional)" value={troco} onChange={(e) => setTroco(e.target.value)} className="mt-3" type="number" />
                )}
              </div>
              <div onClick={() => setPaymentType("credito")} className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 ${paymentType === "credito" ? "border-primary bg-orange-50" : "border-gray-200"}`}>
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-semibold">Cartão de crédito</span>
                {paymentType === "credito" && <Check className="w-4 h-4 text-primary ml-auto" />}
              </div>
              <div onClick={() => setPaymentType("debito")} className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 ${paymentType === "debito" ? "border-primary bg-orange-50" : "border-gray-200"}`}>
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-semibold">Cartão de débito</span>
                {paymentType === "debito" && <Check className="w-4 h-4 text-primary ml-auto" />}
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(total)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Entrega</span><span className={deliveryType === "entrega" && deliveryFee && deliveryFee > 0 ? "font-semibold" : "text-green-600"}>{deliveryType === "retirada" || !deliveryFee || deliveryFee === 0 ? "Grátis" : formatPrice(deliveryFee)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary">{formatPrice(orderTotal)}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 pb-6 pt-2 space-y-2 border-t flex-shrink-0">
          {step === "cart" && items.length > 0 && (
            <Button onClick={handleGoToDelivery} size="lg" className="w-full font-semibold">Continuar pedido</Button>
          )}
          {step === "delivery" && (
            <>
              <Button onClick={handleGoToConfirmation} size="lg" className="w-full font-semibold">Continuar</Button>
              <Button onClick={() => setStep("cart")} variant="outline" className="w-full">Voltar</Button>
            </>
          )}
          {step === "confirmation" && (
            <>
              <Button onClick={() => setStep("payment")} size="lg" className="w-full font-semibold">Escolher pagamento</Button>
              <Button onClick={() => setStep("delivery")} variant="outline" className="w-full">Voltar</Button>
            </>
          )}
          {step === "payment" && (
            <>
              <Button onClick={handleSendOrder} size="lg" className="w-full font-semibold bg-green-600 hover:bg-green-700">Enviar Pedido</Button>
              <Button onClick={() => setStep("confirmation")} variant="outline" className="w-full">Voltar</Button>
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
