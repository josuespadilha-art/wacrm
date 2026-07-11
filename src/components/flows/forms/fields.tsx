"use client";

/**
 * Reusable field components shared across every per-node form.
 *
 * `NodeKeySelect` — picks a node from the flow's node list, rendered
 * with the source node's icon so the dropdown reads as
 * "destination = ◇ menu" rather than an opaque slug.
 *
 * `NextNodeRow` — wraps NodeKeySelect with a label; the most common
 * per-node form row ("after this node, advance to…").
 *
 * `TextRow` — wraps Input or Textarea behind a label. Pure UI sugar
 * to keep per-node forms uncluttered.
 *
 * Lives in src/components/flows/forms/ so both the list view's
 * collapsed-card editor and the canvas view's side-panel editor
 * (introduced in this PR) mount the exact same form components.
 */

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { NODE_META, type BuilderNode } from "../shared";

import { useRef } from "react";
import { Braces } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TextRow({
  label,
  value,
  onChange,
  rows = 1,
  availableVars = [
    "contact.name",
    "contact.phone",
    "contact.email",
    "vars.agendamento_data",
    "vars.agendamento_hora",
    "vars.sua_chave",
  ],
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  availableVars?: string[];
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const insertVar = (variable: string) => {
    const el = inputRef.current;
    if (!el) {
      onChange(value + variable);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const newValue = value.slice(0, start) + variable + value.slice(end);
    onChange(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs text-muted-foreground">{label}</label>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Braces className="h-3 w-3" />
            Variáveis
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto text-xs">
            {availableVars.map((v) => {
              let label = v;
              if (v === "contact.name") label = "Nome do Cliente";
              else if (v === "contact.phone") label = "Telefone";
              else if (v === "contact.email") label = "E-mail";
              else if (v === "vars.agendamento_data") label = "Data do Agendamento";
              else if (v === "vars.agendamento_hora") label = "Hora do Agendamento";
              else if (v === "vars.sua_chave") label = "Variável Personalizada";
              return (
                <DropdownMenuItem key={v} onClick={() => insertVar(`{{${v}}}`)}>
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {rows > 1 ? (
        <Textarea
          ref={inputRef as any}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="bg-muted"
        />
      ) : (
        <Input
          ref={inputRef as any}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-muted"
        />
      )}
    </div>
  );
}

export function NextNodeRow({
  value,
  allNodes,
  currentKey,
  onChange,
  label,
}: {
  value: string;
  allNodes: BuilderNode[];
  currentKey: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <NodeKeySelect
        value={value || null}
        nodes={allNodes}
        excludeKey={currentKey}
        onChange={(v) => onChange(v ?? "")}
        placeholder={useTranslations("Flows.builder.form")("pickNextNode")}
      />
    </div>
  );
}

export function TimeoutConfigFields({
  cfg,
  onUpdateConfig,
  allNodes,
  currentKey,
}: {
  cfg: { timeout_minutes?: number; timeout_node_key?: string };
  onUpdateConfig: (patch: Record<string, unknown>) => void;
  allNodes: BuilderNode[];
  currentKey: string;
}) {
  const t = useTranslations("Flows.builder.form");
  return (
    <div className="space-y-4 pt-4 border-t border-border mt-4">
      <div className="space-y-1">
        <label className="text-xs font-medium">Tempo limite (minutos)</label>
        <Input
          type="number"
          min="1"
          placeholder="Ex: 60 para 1 hora"
          value={cfg.timeout_minutes || ""}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onUpdateConfig({ timeout_minutes: isNaN(val) ? undefined : val });
          }}
          className="bg-muted"
        />
        <p className="text-[0.8rem] text-muted-foreground pt-1">
          Se o cliente não responder neste tempo, o fluxo seguirá pela rota abaixo.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Se não responder (Timeout), avançar para:</label>
        <NodeKeySelect
          value={cfg.timeout_node_key || null}
          nodes={allNodes}
          excludeKey={currentKey}
          onChange={(v) => onUpdateConfig({ timeout_node_key: v ?? "" })}
          placeholder={t("pickNextNode")}
        />
      </div>
    </div>
  );
}

export function NodeKeySelect({
  value,
  nodes,
  excludeKey,
  onChange,
  placeholder,
  className,
}: {
  value: string | null;
  nodes: BuilderNode[];
  excludeKey?: string;
  onChange: (v: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("Flows.builder.form");
  const options = nodes.filter((n) => n.node_key !== excludeKey);
  return (
    <Select
      value={value ?? "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? null : v)}
    >
      <SelectTrigger className={cn("bg-muted", className)}>
        <SelectValue placeholder={placeholder ?? "—"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">{t("none")}</SelectItem>
        {options.map((n) => {
          const Icon = NODE_META[n.node_type].icon;
          return (
            <SelectItem key={n.node_key} value={n.node_key}>
              <span className="inline-flex items-center gap-1.5">
                <Icon
                  className={cn("h-3 w-3", NODE_META[n.node_type].color)}
                />
                {n.node_key}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
