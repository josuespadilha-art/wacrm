"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SettingsPanelHead } from "./settings-panel-head";

/**
 * Configurações de Retenção de Clientes — thresholds de lead em risco e lead perdido.
 * Esses valores alimentam os cards financeiros do Dashboard.
 */
export function LeadRetentionSettings() {
  const supabase = createClient();
  const { accountId, leadAtRiskDays, leadLostDays, canEditSettings, profileLoading, refreshProfile } = useAuth();

  const [atRisk, setAtRisk] = useState(leadAtRiskDays);
  const [lost, setLost] = useState(leadLostDays);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAtRisk(leadAtRiskDays);
    setLost(leadLostDays);
  }, [leadAtRiskDays, leadLostDays]);

  const dirty = atRisk !== leadAtRiskDays || lost !== leadLostDays;

  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Math.floor(v)));

  async function handleSave() {
    if (!accountId || !dirty) return;
    const safeAtRisk = clamp(atRisk, 1, 365);
    const safeLost = clamp(lost, 1, 730);
    if (safeLost <= safeAtRisk) {
      toast.error("O prazo de 'Lead Perdido' deve ser maior que o prazo de 'Em Risco'.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("accounts")
      .update({ lead_at_risk_days: safeAtRisk, lead_lost_days: safeLost })
      .eq("id", accountId);
    if (error) {
      toast.error("Falha ao salvar. Tente novamente.");
      setSaving(false);
      return;
    }
    await refreshProfile();
    setSaving(false);
    toast.success("Configurações de retenção salvas!");
  }

  const disabled = !canEditSettings || profileLoading;

  return (
    <section className="max-w-2xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="Retenção de Clientes"
        description="Defina os prazos para identificar leads em risco e leads perdidos no seu dashboard."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="size-4 text-primary" />
            Prazos de Inatividade
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Esses valores alimentam os cards{" "}
            <strong>Potencial a Recuperar</strong> e{" "}
            <strong>Receita Estimada Perdida</strong> do Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="at-risk-days">
              Dias para considerar Lead <span className="text-amber-500 font-semibold">Em Risco</span>
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Clientes que não compraram nesse período entram no grupo de recuperação.
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="at-risk-days"
                type="number"
                min={1}
                max={365}
                value={atRisk}
                onChange={(e) => setAtRisk(Number(e.target.value))}
                disabled={disabled}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
          </div>

          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="lost-days">
              Dias para considerar Lead <span className="text-red-500 font-semibold">Perdido</span>
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Clientes que não compraram nesse período somam ao valor estimado de receita perdida.
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="lost-days"
                type="number"
                min={1}
                max={730}
                value={lost}
                onChange={(e) => setLost(Number(e.target.value))}
                disabled={disabled}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
          </div>

          {!canEditSettings && (
            <p className="text-xs text-muted-foreground">
              Apenas administradores podem alterar essas configurações.
            </p>
          )}

          {canEditSettings && (
            <Button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
