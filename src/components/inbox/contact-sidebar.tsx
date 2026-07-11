"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { Contact, Deal, ContactNote, Tag, Sale, SalesItem, Product } from "@/types";
import {
  Phone,
  Mail,
  Copy,
  Check,
  User,
  Tag as TagIcon,
  DollarSign,
  StickyNote,
  Plus,
  ShoppingCart,
  GitBranch,
  Cake,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { ContactForm } from "@/components/contacts/contact-form";
import { ProductPicker } from "@/components/products/product-picker";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactSidebarProps {
  contact: Contact | null;
  products?: Product[];
  onRegisterPurchase?: (selectedProducts: Array<{ product_id: string; quantity: number }>) => void;
  isRegistringPurchase?: boolean;
}

export function ContactSidebar({
  contact,
  products = [],
  onRegisterPurchase,
  isRegistringPurchase = false,
}: ContactSidebarProps) {
  const tSidebar = useTranslations("Inbox.sidebar");
  const tThread = useTranslations("Inbox.messageThread");

  const { accountId } = useAuth();
  const [copied, setCopied] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [tags, setTags] = useState<(Tag & { contact_tag_id: string })[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [lastSaleTotal, setLastSaleTotal] = useState<number | null>(null);
  const [lastSaleDate, setLastSaleDate] = useState<string | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [contactPipeline, setContactPipeline] = useState<{pipeline_id: string, stage_id: string} | null>(null);
  const [pendingWonStage, setPendingWonStage] = useState<{pipelineId: string, stageId: string} | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchContactData = useCallback(async () => {
    if (!contact) return;

    const supabase = createClient();

    // Fetch deals, notes, tags, and sales in parallel
    const [dealsRes, notesRes, tagsRes, salesRes, pipelinesRes] = await Promise.all([
      supabase
        .from("deals")
        .select("*, stage:pipeline_stages(*)")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("contact_notes")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("contact_tags")
        .select("id, tag_id, tags(*)")
        .eq("contact_id", contact.id),
      supabase
        .from("sales")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("pipelines")
        .select("*, stages:pipeline_stages(*)")
        .order("created_at", { ascending: false }),
    ]);

    if (dealsRes.data) setDeals(dealsRes.data);
    if (notesRes.data) setNotes(notesRes.data);
    if (tagsRes.data) {
      const mapped = tagsRes.data
        .filter((ct: Record<string, unknown>) => ct.tags)
        .map((ct: Record<string, unknown>) => ({
          ...(ct.tags as Tag),
          contact_tag_id: ct.id as string,
        }));
      setTags(mapped);
    }
    if (salesRes.data) {
      setSales(salesRes.data);
      if (salesRes.data.length > 0) {
        const lastSale = salesRes.data[0];
        setLastSaleTotal(lastSale.total_value);
        setLastSaleDate(lastSale.created_at);
      }
    }
    if (pipelinesRes.data) {
      setPipelines(pipelinesRes.data);
      // Get the contact's current pipeline/stage if they have a deal
      if (dealsRes.data && dealsRes.data.length > 0) {
        const deal = dealsRes.data[0];
        setContactPipeline({ pipeline_id: deal.pipeline_id, stage_id: deal.stage_id });
      }
    }
  }, [contact]);

  // Load on contact change. setContactData/setTags run inside async
  // Supabase callbacks, not synchronously in the effect body.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContactData();
  }, [fetchContactData]);

  const handleCopyPhone = useCallback(async () => {
    if (!contact?.phone) return;
    await navigator.clipboard.writeText(contact.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Dep is the whole `contact` object (not `contact?.phone`) so the
    // React Compiler's inference agrees with the manual dep list —
    // fixes the `preserve-manual-memoization` lint error.
  }, [contact]);

  const handleAddNote = useCallback(async () => {
    if (!contact || !newNote.trim()) return;
    if (!accountId) return;
    setAddingNote(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    const { data, error } = await supabase
      .from("contact_notes")
      .insert({
        contact_id: contact.id,
        account_id: accountId,
        user_id: user?.id,
        note_text: newNote.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      setNewNote("");
    }
    setAddingNote(false);
  }, [contact, newNote, accountId]);

  const [savingPipeline, setSavingPipeline] = useState(false);

  const handlePipelineChange = async (pipelineId: string, stageId: string) => {
    if (!contact || !accountId) return;
    setSavingPipeline(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (deals.length > 0) {
        // Update existing deal
        const { error } = await supabase
          .from("deals")
          .update({ stage_id: stageId })
          .eq("id", deals[0].id);
          
        if (error) throw error;
      } else {
        // Create new deal
        const pipeline = pipelines.find(p => p.id === pipelineId);
        const { error } = await supabase
          .from("deals")
          .insert({
            contact_id: contact.id,
            account_id: accountId,
            user_id: user?.id,
            pipeline_id: pipelineId,
            stage_id: stageId,
            title: `Deal - ${contact.name || contact.phone}`,
            value: 0
          });
          
        if (error) throw error;
      }

      setContactPipeline({ pipeline_id: pipelineId, stage_id: stageId });
      toast.success("Pipeline atualizado com sucesso!");
      fetchContactData(); // refresh deals
    } catch (error: any) {
      console.error("Error updating pipeline:", error);
      toast.error("Erro ao salvar pipeline.");
    } finally {
      setSavingPipeline(false);
    }
  };

  if (!contact) {
    return (
      <div className="flex h-full w-70 items-center justify-center border-l border-border bg-card">
        <p className="text-sm text-muted-foreground">{tThread("selectConversation")}</p>
      </div>
    );
  }

  const displayName = contact.name || contact.phone;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-full w-70 flex-col border-l border-border bg-card">
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Contact Info */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground">
              {contact.avatar_url ? (
                <img
                  src={contact.avatar_url}
                  alt={displayName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {displayName}
              </h3>
              <button 
                onClick={() => setEditOpen(true)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Editar contato"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button 
                onClick={async () => {
                  if (window.confirm("Tem certeza que deseja excluir este contato? Esta ação apagará todo o histórico de mensagens, compras e anotações e não pode ser desfeita.")) {
                    try {
                      const supabase = createClient();
                      const { error } = await supabase.from("contacts").delete().eq("id", contact.id);
                      if (error) throw error;
                      toast.success("Contato excluído com sucesso.");
                      window.location.reload();
                    } catch (err) {
                      console.error("Erro ao excluir contato:", err);
                      toast.error("Erro ao excluir contato.");
                    }
                  }
                }}
                className="rounded-md p-1 text-red-500 hover:bg-red-500/10"
                title="Excluir contato"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            {contact.company && (
              <p className="text-xs text-muted-foreground">{contact.company}</p>
            )}
          </div>

          {/* Phone */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleCopyPhone}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-left">{contact.phone}</span>
              {copied ? (
                <Check className="h-3 w-3 text-primary" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>

            {contact.email && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            
            {contact.birth_date && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                <Cake className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{new Date(contact.birth_date + "T12:00:00Z").toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <TagIcon className="h-3 w-3" />
              {tSidebar("tags")}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">{tSidebar("noTags")}</p>
              ) : (
                tags.map((tag) => (
                  <span
                    key={tag.contact_tag_id}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Active Deals */}
          <div>
            <div className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              {tSidebar("deals")}
            </div>
            <div className="mt-2 space-y-2">
              {deals.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">{tSidebar("noDeals")}</p>
              ) : (
                deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-lg bg-muted px-3 py-2"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {deal.title}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {deal.currency ?? "$"}
                        {deal.value.toLocaleString()}
                      </span>
                      {deal.stage && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px]"
                          style={{
                            backgroundColor: `${deal.stage.color}20`,
                            color: deal.stage.color,
                          }}
                        >
                          {deal.stage.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Pipeline Selection */}
          <div>
            <div className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              Pipeline
            </div>
            <div className="mt-2 space-y-2">
              {pipelines.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">Nenhum pipeline disponível</p>
              ) : (
                <div className="space-y-4">
                  {pipelines.map((pipeline) => (
                    <div key={pipeline.id} className="space-y-1">
                      <p className="text-xs font-medium text-foreground">
                        {pipeline.name}
                      </p>
                      <Select 
                        disabled={savingPipeline}
                        value={contactPipeline?.pipeline_id === pipeline.id ? contactPipeline?.stage_id : undefined} 
                        onValueChange={(stageId) => {
                          if (stageId) {
                            const stageName = pipeline.stages?.find((s: any) => s.id === stageId)?.name || '';
                            const lower = stageName.toLowerCase();
                            if (lower.includes('ganho') || lower.includes('fechado') || lower.includes('won')) {
                              setPendingWonStage({ pipelineId: pipeline.id, stageId });
                              setProductPickerOpen(true);
                            } else {
                              handlePipelineChange(pipeline.id, stageId);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecione a etapa">
                            {contactPipeline?.pipeline_id === pipeline.id
                              ? pipeline.stages?.find((s: any) => s.id === contactPipeline?.stage_id)?.name || "Selecione a etapa"
                              : "Selecione a etapa"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {pipeline.stages?.map((stage: any) => (
                            <SelectItem key={stage.id} value={stage.id} className="text-xs">
                              {stage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Register Purchase */}
          <div>
            <button
              onClick={() => setProductPickerOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Registrar Compra
            </button>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Purchase History */}
          <div>
            <div className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <ShoppingCart className="h-3 w-3" />
              Histórico
            </div>
            <div className="mt-2 space-y-2">
              {sales.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">Nenhuma compra registrada</p>
              ) : (
                <>
                  {lastSaleTotal !== null && (
                    <div className="rounded-lg bg-green-500/10 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Última Compra</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        R$ {lastSaleTotal.toFixed(2)}
                      </p>
                      {lastSaleDate && (
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(lastSaleDate), "d 'de' MMMM 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      )}
                    </div>
                  )}
                  {sales.length > 1 && (
                    <div className="text-[10px] text-muted-foreground">
                      <p>Total de vendas: {sales.length}</p>
                      <p className="mt-1">
                        Valor total: R${" "}
                        {sales.reduce((sum, s) => sum + s.total_value, 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Notes */}
          <div>
            <div className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <StickyNote className="h-3 w-3" />
              {tSidebar("notes")}
            </div>
            <div className="mt-2">
              <div className="flex gap-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={tSidebar("addNotePlaceholder")}
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary/50"
                />
                <Button
                  size="sm"
                  className="h-auto bg-primary px-2 hover:bg-primary/90"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="mt-2 space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg bg-muted px-3 py-2"
                  >
                    <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                      {note.note_text}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {format(new Date(note.created_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      <ProductPicker
        open={productPickerOpen}
        onOpenChange={setProductPickerOpen}
        products={products}
        onConfirm={async (data) => {
          if (onRegisterPurchase) {
            await onRegisterPurchase(data);
          }
          
          if (pendingWonStage) {
            await handlePipelineChange(pendingWonStage.pipelineId, pendingWonStage.stageId);
            setPendingWonStage(null);
          } else {
            // Find "Ganho/Fechado" stage to auto-move if manual purchase
            let wonStage = null;
            for (const p of pipelines) {
              for (const s of (p.stages || [])) {
                const lower = (s.name || '').toLowerCase();
                if (lower.includes('ganho') || lower.includes('fechado') || lower.includes('won')) {
                  wonStage = { pipelineId: p.id, stageId: s.id };
                  break;
                }
              }
              if (wonStage) break;
            }
            
            if (wonStage && contactPipeline?.stage_id !== wonStage.stageId) {
              await handlePipelineChange(wonStage.pipelineId, wonStage.stageId);
            }
          }
        }}
        isLoading={isRegistringPurchase}
      />
      <ContactForm 
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
        contactTags={[]}
        onSaved={() => {
          // You could reload data here or trigger a refresh in the parent component
          window.location.reload();
        }}
      />
    </div>
  );
}
