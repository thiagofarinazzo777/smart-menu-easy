import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Flame, Eye, EyeOff } from "lucide-react";

interface CustomerAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidPhone(value: string) {
  return value.replace(/\D/g, "").length === 11;
}

export function CustomerAuthModal({ open, onOpenChange }: CustomerAuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const { toast } = useToast();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, phone: formatPhone(e.target.value) }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bem-vindo de volta!" });
      onOpenChange(false);
      setForm({ name: "", email: "", password: "", phone: "" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Informe seu nome completo", variant: "destructive" });
      return;
    }
    if (!isValidPhone(form.phone)) {
      toast({ title: "Informe um telefone válido", description: "Ex: (11) 99999-9999", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      return;
    }

    // Update profile with phone
    if (data.user) {
      await supabase.from("profiles").update({ phone: form.phone.replace(/\D/g, ""), full_name: form.name }).eq("user_id", data.user.id);
    }

    setLoading(false);
    toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar." });
    onOpenChange(false);
    setForm({ name: "", email: "", password: "", phone: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader className="items-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-1">
            <Flame className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center font-serif italic text-xl" style={{ color: "#d4a017" }}>
            Ouro & Brasa
          </DialogTitle>
        </DialogHeader>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <button type="button" onClick={() => setMode("register")} className="text-primary font-semibold">
                Criar conta
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <Input
              placeholder="Nome completo"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <Input
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha (mínimo 6 caracteres)"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              placeholder="Telefone (11) 99999-9999"
              value={form.phone}
              onChange={handlePhoneChange}
              inputMode="numeric"
              required
            />
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold">
                Entrar
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
