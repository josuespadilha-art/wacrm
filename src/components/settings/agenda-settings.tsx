"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface OperatingHour {
  id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const DAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

export function AgendaSettings() {
  const { account } = useAuth();
  const supabase = createClient();
  const [hours, setHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!account?.id) return;
    
    async function loadHours() {
      const { data } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('account_id', account!.id)
        .order('day_of_week');

      if (data && data.length > 0) {
        setHours(data as OperatingHour[]);
      } else {
        // Defaults if none exist
        const defaults = DAYS.map((_, index) => ({
          day_of_week: index,
          open_time: "09:00:00",
          close_time: "18:00:00",
          is_closed: index === 0 || index === 6, // Closed on weekends by default
        }));
        setHours(defaults);
      }
      setLoading(false);
    }
    loadHours();
  }, [account?.id]);

  const handleChange = (dayIndex: number, field: keyof OperatingHour, value: any) => {
    setHours(prev => {
      const copy = [...prev];
      const index = copy.findIndex(h => h.day_of_week === dayIndex);
      if (index >= 0) {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const handleSave = async () => {
    if (!account?.id) return;
    setSaving(true);
    
    try {
      const payload = hours.map(h => ({
        ...h,
        account_id: account.id,
      }));

      // Upsert
      await supabase
        .from('operating_hours')
        .upsert(payload, { onConflict: 'account_id,day_of_week' });
        
      alert("Horários salvos com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar horários.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-foreground">Horários de Atendimento</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Defina os horários oficiais em que a agenda estará aberta para marcações.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        {DAYS.map((dayName, index) => {
          const dayConfig = hours.find(h => h.day_of_week === index);
          if (!dayConfig) return null;

          return (
            <div key={index} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-4 w-48">
                <Switch 
                  checked={!dayConfig.is_closed}
                  onCheckedChange={(checked) => handleChange(index, 'is_closed', !checked)}
                />
                <Label className={`font-medium ${dayConfig.is_closed ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {dayName}
                </Label>
              </div>

              {!dayConfig.is_closed ? (
                <div className="flex items-center gap-2">
                  <Input 
                    type="time" 
                    value={dayConfig.open_time.slice(0, 5)} 
                    onChange={(e) => handleChange(index, 'open_time', e.target.value + ':00')}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">até</span>
                  <Input 
                    type="time" 
                    value={dayConfig.close_time.slice(0, 5)} 
                    onChange={(e) => handleChange(index, 'close_time', e.target.value + ':00')}
                    className="w-32"
                  />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic mr-16">
                  Fechado
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Horários'}
        </Button>
      </div>
    </div>
  );
}
