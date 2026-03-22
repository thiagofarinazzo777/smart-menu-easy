import { useState, useEffect } from "react";
import { useBusinessHours, DAY_NAMES, BusinessHour } from "@/hooks/useBusinessHours";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save } from "lucide-react";

export function BusinessHoursEditor() {
  const { hours, isLoading } = useBusinessHours();
  const [form, setForm] = useState<BusinessHour[]>([]);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (hours.length > 0 && form.length === 0) {
      setForm(hours.map((h) => ({ ...h })));
    }
  }, [hours, form.length]);

  const updateDay = (dayOfWeek: number, field: keyof BusinessHour, value: any) => {
    setForm((prev) =>
      prev.map((h) =>
        h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const h of form) {
        await supabase
          .from("business_hours")
          .update({
            open_time: h.is_closed ? null : h.open_time,
            close_time: h.is_closed ? null : h.close_time,
            is_closed: h.is_closed,
          })
          .eq("id", h.id);
      }
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      toast({ title: "Horários salvos com sucesso!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" /> Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {form
          .sort((a, b) => a.day_of_week - b.day_of_week)
          .map((h) => (
            <div
              key={h.day_of_week}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                h.is_closed ? "bg-muted/50 opacity-60" : ""
              }`}
            >
              <div className="w-20 flex-shrink-0">
                <span className="text-sm font-medium">{DAY_NAMES[h.day_of_week]}</span>
              </div>

              <div className="flex items-center gap-2 flex-1">
                {!h.is_closed && (
                  <>
                    <Input
                      type="time"
                      value={h.open_time?.slice(0, 5) || ""}
                      onChange={(e) => updateDay(h.day_of_week, "open_time", e.target.value)}
                      className="w-28 text-sm"
                    />
                    <span className="text-muted-foreground text-xs">às</span>
                    <Input
                      type="time"
                      value={h.close_time?.slice(0, 5) || ""}
                      onChange={(e) => updateDay(h.day_of_week, "close_time", e.target.value)}
                      className="w-28 text-sm"
                    />
                  </>
                )}
                {h.is_closed && (
                  <span className="text-sm text-muted-foreground italic">Fechado</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-muted-foreground">Aberto</span>
                <Switch
                  checked={!h.is_closed}
                  onCheckedChange={(v) => updateDay(h.day_of_week, "is_closed", !v)}
                />
              </div>
            </div>
          ))}

        <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Horários"}
        </Button>
      </CardContent>
    </Card>
  );
}
