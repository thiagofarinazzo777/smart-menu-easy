import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

export function DeliveryZonesEditor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<{ id: string; neighborhood: string; fee: number } | null>(null);
  const [form, setForm] = useState({ neighborhood: "", fee: "" });

  const { data: zones = [] } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const { data } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("neighborhood");
      return data ?? [];
    },
  });

  const saveZone = useMutation({
    mutationFn: async () => {
      const payload = {
        neighborhood: form.neighborhood.trim(),
        fee: parseFloat(form.fee) || 0,
      };
      if (editingZone) {
        await supabase.from("delivery_zones").update(payload).eq("id", editingZone.id);
      } else {
        await supabase.from("delivery_zones").insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      setDialogOpen(false);
      toast({ title: editingZone ? "Bairro atualizado" : "Bairro cadastrado" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from("delivery_zones").update({ is_active: active }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["delivery-zones"] }),
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("delivery_zones").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      toast({ title: "Bairro removido" });
    },
  });

  const openNew = () => {
    setEditingZone(null);
    setForm({ neighborhood: "", fee: "" });
    setDialogOpen(true);
  };

  const openEdit = (z: any) => {
    setEditingZone(z);
    setForm({ neighborhood: z.neighborhood, fee: String(z.fee) });
    setDialogOpen(true);
  };

  const formatPrice = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-4">
      <Button onClick={openNew} className="w-full">
        <Plus className="w-4 h-4 mr-1" /> Novo Bairro
      </Button>

      {zones.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">
          Nenhum bairro cadastrado. Adicione bairros para definir taxas de entrega.
        </p>
      )}

      {zones.map((z: any) => (
        <Card key={z.id}>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{z.neighborhood}</p>
              <p className="text-xs text-muted-foreground">
                {Number(z.fee) === 0 ? "Grátis" : formatPrice(Number(z.fee))}
              </p>
            </div>
            <Switch
              checked={z.is_active}
              onCheckedChange={(v) => toggleActive.mutate({ id: z.id, active: v })}
            />
            <Button variant="ghost" size="icon" onClick={() => openEdit(z)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteZone.mutate(z.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZone ? "Editar Bairro" : "Novo Bairro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do bairro</label>
              <Input
                placeholder="Ex: Centro, Jardins, Vila Mariana"
                value={form.neighborhood}
                onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Taxa de entrega (R$)</label>
              <Input
                placeholder="0.00"
                type="number"
                step="0.50"
                min="0"
                value={form.fee}
                onChange={(e) => setForm((p) => ({ ...p, fee: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveZone.mutate()} disabled={!form.neighborhood.trim()}>
              {editingZone ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
