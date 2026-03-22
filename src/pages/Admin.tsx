import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Pencil, Trash2, Flame, Clock, MapPin } from "lucide-react";
import { BusinessHoursEditor } from "@/components/admin/BusinessHoursEditor";
import { DeliveryZonesEditor } from "@/components/admin/DeliveryZonesEditor";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useEffect } from "react";

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, loading, navigate]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data } = await supabase.from("menu_items").select("*").order("created_at");
      return data ?? [];
    },
  });

  const { data: config } = useQuery({
    queryKey: ["restaurant-config"],
    queryFn: async () => {
      const { data } = await supabase.from("restaurant_config").select("*").limit(1).single();
      return data;
    },
  });

  // --- ITEM CRUD ---
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Tables<"menu_items"> | null>(null);
  const [itemForm, setItemForm] = useState({ name: "", description: "", price: "", category_id: "", image_url: "" });

  const openNewItem = () => {
    setEditingItem(null);
    setItemForm({ name: "", description: "", price: "", category_id: "", image_url: "" });
    setItemDialog(true);
  };

  const openEditItem = (item: Tables<"menu_items">) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category_id: item.category_id ?? "",
      image_url: item.image_url ?? "",
    });
    setItemDialog(true);
  };

  const saveItem = useMutation({
    mutationFn: async () => {
      const payload: TablesInsert<"menu_items"> = {
        name: itemForm.name,
        description: itemForm.description || null,
        price: parseFloat(itemForm.price) || 0,
        category_id: itemForm.category_id || null,
        image_url: itemForm.image_url || null,
      };
      if (editingItem) {
        await supabase.from("menu_items").update(payload).eq("id", editingItem.id);
      } else {
        await supabase.from("menu_items").insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      setItemDialog(false);
      toast({ title: editingItem ? "Item atualizado" : "Item criado" });
    },
  });

  const toggleAvailable = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      await supabase.from("menu_items").update({ is_available: available }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("menu_items").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast({ title: "Item excluído" });
    },
  });

  // --- CATEGORY CRUD ---
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Tables<"categories"> | null>(null);
  const [catName, setCatName] = useState("");

  const saveCat = useMutation({
    mutationFn: async () => {
      if (editingCat) {
        await supabase.from("categories").update({ name: catName }).eq("id", editingCat.id);
      } else {
        const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 0;
        await supabase.from("categories").insert({ name: catName, sort_order: maxOrder });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCatDialog(false);
      toast({ title: editingCat ? "Categoria atualizada" : "Categoria criada" });
    },
  });

  const deleteCat = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("categories").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Categoria excluída" });
    },
  });

  // --- CONFIG ---
  const [configForm, setConfigForm] = useState({
    name: "",
    description: "",
    whatsapp_number: "",
    logo_url: "",
    city: "Marília - SP",
    rating: "4.8",
    rating_count: "100+",
    zone1_fee: "5",
    zone2_fee: "8",
    zone3_fee: "12",
    delivery_time: "40-70 min",
    min_order: "30",
  });
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    if (config && !configLoaded) {
      setConfigForm({
        name: config.name,
        description: config.description ?? "",
        whatsapp_number: config.whatsapp_number ?? "",
        logo_url: config.logo_url ?? "",
        city: (config as any).city ?? "Marília - SP",
        rating: String((config as any).rating ?? 4.8),
        rating_count: (config as any).rating_count ?? "100+",
        zone1_fee: String(config.zone1_fee ?? 5),
        zone2_fee: String(config.zone2_fee ?? 8),
        zone3_fee: String(config.zone3_fee ?? 12),
      });
      setConfigLoaded(true);
    }
  }, [config, configLoaded]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      if (config) {
        const { zone1_fee, zone2_fee, zone3_fee, rating, ...rest } = configForm;
        await supabase.from("restaurant_config").update({
          ...rest,
          rating: parseFloat(rating) || 0,
          zone1_fee: parseFloat(zone1_fee) || 0,
          zone2_fee: parseFloat(zone2_fee) || 0,
          zone3_fee: parseFloat(zone3_fee) || 0,
        } as any).eq("id", config.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-config"] });
      toast({ title: "Configurações salvas" });
    },
  });

  // --- IMAGE UPLOAD ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(path);
    setItemForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    toast({ title: "Imagem enviada!" });
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <span className="font-bold">Painel Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/admin/login"); }}>
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="items">
          <TabsList className="w-full mb-6 flex-wrap">
            <TabsTrigger value="items" className="flex-1">Cardápio</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1">Categorias</TabsTrigger>
            <TabsTrigger value="hours" className="flex-1"><Clock className="w-3.5 h-3.5 mr-1" />Horários</TabsTrigger>
            <TabsTrigger value="delivery" className="flex-1"><MapPin className="w-3.5 h-3.5 mr-1" />Entregas</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Config</TabsTrigger>
          </TabsList>

          {/* ITEMS TAB */}
          <TabsContent value="items" className="space-y-4">
            <Button onClick={openNewItem} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Novo Item
            </Button>
            {menuItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center text-xl">🍔</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {categories.find((c) => c.id === item.category_id)?.name ?? "Sem categoria"} • R$ {Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  <Switch
                    checked={item.is_available}
                    onCheckedChange={(v) => toggleAvailable.mutate({ id: item.id, available: v })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEditItem(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteItem.mutate(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-4">
            <Button
              onClick={() => { setEditingCat(null); setCatName(""); setCatDialog(true); }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" /> Nova Categoria
            </Button>
            {categories.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="font-medium">{cat.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatDialog(true); }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCat.mutate(cat.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* HOURS TAB */}
          <TabsContent value="hours">
            <BusinessHoursEditor />
          </TabsContent>

          {/* DELIVERY ZONES TAB */}
          <TabsContent value="delivery">
            <DeliveryZonesEditor />
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações do Restaurante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    value={configForm.name}
                    onChange={(e) => setConfigForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={configForm.description}
                    onChange={(e) => setConfigForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">WhatsApp (com DDD e código do país)</label>
                  <Input
                    placeholder="5511999999999"
                    value={configForm.whatsapp_number}
                    onChange={(e) => setConfigForm((p) => ({ ...p, whatsapp_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL do Logo</label>
                  <Input
                    value={configForm.logo_url}
                    onChange={(e) => setConfigForm((p) => ({ ...p, logo_url: e.target.value }))}
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Localidade e Avaliação
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Cidade (ex: Marília - SP)</label>
                      <Input
                        value={configForm.city}
                        onChange={(e) => setConfigForm((p) => ({ ...p, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nota (ex: 4.8)</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={configForm.rating}
                        onChange={(e) => setConfigForm((p) => ({ ...p, rating: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Quantidade de avaliações (ex: 100+)</label>
                      <Input
                        value={configForm.rating_count}
                        onChange={(e) => setConfigForm((p) => ({ ...p, rating_count: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Taxa de Entrega por Zona
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">Configure o valor da entrega para cada faixa de distância.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Zona 1 — até 3 km (R$)</label>
                      <Input type="number" step="0.50" min="0" value={configForm.zone1_fee} onChange={(e) => setConfigForm((p) => ({ ...p, zone1_fee: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Zona 2 — 3 a 6 km (R$)</label>
                      <Input type="number" step="0.50" min="0" value={configForm.zone2_fee} onChange={(e) => setConfigForm((p) => ({ ...p, zone2_fee: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Zona 3 — acima de 6 km (R$)</label>
                      <Input type="number" step="0.50" min="0" value={configForm.zone3_fee} onChange={(e) => setConfigForm((p) => ({ ...p, zone3_fee: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <Button onClick={() => saveConfig.mutate()} className="w-full">
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Item Dialog */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome do item"
              value={itemForm.name}
              onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Textarea
              placeholder="Descrição"
              value={itemForm.description}
              onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
            />
            <Input
              placeholder="Preço"
              type="number"
              step="0.01"
              value={itemForm.price}
              onChange={(e) => setItemForm((p) => ({ ...p, price: e.target.value }))}
            />
            <Select
              value={itemForm.category_id}
              onValueChange={(v) => setItemForm((p) => ({ ...p, category_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <label className="text-sm font-medium block mb-1">Foto do item</label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
              {itemForm.image_url && (
                <img src={itemForm.image_url} alt="Preview" className="mt-2 w-20 h-20 rounded-lg object-cover" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveItem.mutate()} disabled={!itemForm.name || !itemForm.price}>
              {editingItem ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nome da categoria"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={() => saveCat.mutate()} disabled={!catName.trim()}>
              {editingCat ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
