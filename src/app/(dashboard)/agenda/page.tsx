"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Plus, Trash2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 to 20:00

export default function AgendaPage() {
  const { account } = useAuth();
  const supabase = createClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  
  // Dados do Banco de Dados
  const [employees, setEmployees] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form de Novo Agendamento
  const [isOpen, setIsOpen] = useState(false);
  const [newAppt, setNewAppt] = useState({
    clientName: "",
    service: "",
    employeeId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00"
  });
  const [saving, setSaving] = useState(false);

  // Detalhes do Agendamento (Visualizar, Excluir, Remarcar)
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "", employeeId: "" });
  const [rescheduling, setRescheduling] = useState(false);

  // Carregar Funcionários e Agendamentos
  useEffect(() => {
    if (!account?.id) return;

    async function loadData() {
      setLoading(true);
      
      // Busca funcionários
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: members } = await supabase
        .from("profiles")
        .select("user_id, full_name, account_role")
        .eq("account_id", account!.id);
        
      if (members) {
        const currentUserProfile = members.find(m => m.user_id === session?.user?.id);
        const isAgent = currentUserProfile?.account_role === "agent";

        const filteredMembers = isAgent 
          ? members.filter(m => m.user_id === session?.user?.id) 
          : members;

        setEmployees(filteredMembers.map(m => ({
          id: m.user_id,
          name: m.full_name || "Membro",
          role: m.account_role
        })));
        
        // Se for agent, fixa o filtro no id do próprio agent
        if (isAgent && session?.user?.id) {
          setSelectedEmployee(session.user.id);
        }
      }

      // Busca agendamentos da semana/dia visível
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      
      const { data: appts } = await supabase
        .from("appointments")
        .select("*, contacts(name, phone)")
        .eq("account_id", account!.id)
        .gte("start_time", start.toISOString())
        .lte("start_time", addDays(end, 1).toISOString());

      if (appts) {
        setAppointments(appts);
      }
      
      setLoading(false);
    }

    loadData();
  }, [account?.id, currentDate, view]);

  // Navigation Logic
  const handlePrev = () => {
    if (view === "day") setCurrentDate((prev) => subDays(prev, 1));
    else setCurrentDate((prev) => subWeeks(prev, 1));
  };
  
  const handleNext = () => {
    if (view === "day") setCurrentDate((prev) => addDays(prev, 1));
    else setCurrentDate((prev) => addWeeks(prev, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  // Salvar Novo Agendamento
  const handleSaveAppointment = async () => {
    if (!account?.id || !newAppt.clientName || !newAppt.employeeId || !newAppt.date || !newAppt.time) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const startTime = new Date(`${newAppt.date}T${newAppt.time}:00`); 
      const endTime = addHours(startTime, 1);
      
      const payload = {
        account_id: account.id,
        assignee_id: newAppt.employeeId,
        contact_id: null, 
        notes: `[Agendado Manualmente] Cliente: ${newAppt.clientName} | Serviço: ${newAppt.service}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled'
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(payload)
        .select("*, contacts(name, phone)")
        .single();

      if (error) throw error;
      
      if (data) {
        setAppointments(prev => [...prev, data]);
      }
      setIsOpen(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar agendamento.");
    } finally {
      setSaving(false);
    }
  };

  // Excluir Agendamento
  const handleDeleteAppointment = async () => {
    if (!selectedAppt || !confirm("Tem certeza que deseja excluir este agendamento?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', selectedAppt.id);
      if (error) throw error;
      setAppointments(prev => prev.filter(a => a.id !== selectedAppt.id));
      setIsDetailsOpen(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir agendamento.");
    } finally {
      setDeleting(false);
    }
  };

  // Remarcar Agendamento
  const handleReschedule = async () => {
    if (!selectedAppt || !rescheduleData.date || !rescheduleData.time || !rescheduleData.employeeId) return;
    setRescheduling(true);
    try {
      const startTime = new Date(`${rescheduleData.date}T${rescheduleData.time}:00`); 
      const endTime = addHours(startTime, 1);

      const { data, error } = await supabase
        .from('appointments')
        .update({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          assignee_id: rescheduleData.employeeId
        })
        .eq('id', selectedAppt.id)
        .select("*, contacts(name, phone)")
        .single();

      if (error) throw error;
      if (data) {
        setAppointments(prev => prev.map(a => a.id === data.id ? data : a));
      }
      setIsRescheduling(false);
      setIsDetailsOpen(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao remarcar agendamento.");
    } finally {
      setRescheduling(false);
    }
  };

  const openApptDetails = (appt: any) => {
    setSelectedAppt(appt);
    setRescheduleData({
      date: format(parseISO(appt.start_time), "yyyy-MM-dd"),
      time: format(parseISO(appt.start_time), "HH:mm"),
      employeeId: appt.assignee_id || ""
    });
    setIsRescheduling(false);
    setIsDetailsOpen(true);
  };

  // Week Days calculation
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)); // Mon to Sat

  // Header Format
  const dateHeaderText = view === "day" 
    ? format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
    : `${format(weekStart, "dd 'de' MMM", { locale: ptBR })} - ${format(addDays(weekStart, 5), "dd 'de' MMM", { locale: ptBR })}`;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border px-6 py-4 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          
          <div className="flex items-center bg-muted rounded-md p-1 border border-border">
            <Button variant={view === "day" ? "secondary" : "ghost"} size="sm" onClick={() => setView("day")} className="text-xs h-7">Dia</Button>
            <Button variant={view === "week" ? "secondary" : "ghost"} size="sm" onClick={() => setView("week")} className="text-xs h-7">Semana</Button>
          </div>

          <div className="flex items-center gap-2 bg-muted p-1 rounded-md border border-border">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="h-7 text-xs">Hoje</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-medium ml-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{dateHeaderText}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {view === "week" && (
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="border border-border bg-card text-foreground rounded-md px-3 py-1.5 text-sm"
            >
              <option value="all">Todos os Funcionários</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Agendamento
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Novo Agendamento</SheetTitle>
                <SheetDescription>
                  Preencha os dados abaixo para reservar um horário na agenda manualmente.
                </SheetDescription>
              </SheetHeader>
              
              <div className="grid gap-6 py-6">
                <div className="grid gap-2">
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input 
                    id="clientName" 
                    placeholder="Ex: Carlos Silva"
                    value={newAppt.clientName}
                    onChange={e => setNewAppt({...newAppt, clientName: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="service">Serviço / Notas</Label>
                  <Input 
                    id="service" 
                    placeholder="Ex: Corte de Cabelo" 
                    value={newAppt.service}
                    onChange={e => setNewAppt({...newAppt, service: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="employee">Profissional</Label>
                  <select
                    id="employee"
                    value={newAppt.employeeId}
                    onChange={e => setNewAppt({...newAppt, employeeId: e.target.value})}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="" disabled>Selecione o profissional</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={newAppt.date}
                      onChange={e => setNewAppt({...newAppt, date: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={newAppt.time}
                      onChange={e => setNewAppt({...newAppt, time: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <SheetFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveAppointment} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Agendamento"}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full min-w-[800px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Carregando agenda...
            </div>
          ) : (
            <>
              {/* CABEÇALHO DO GRID */}
              <div className="flex border-b border-border bg-muted/50">
                <div className="w-[80px] p-3 text-center text-xs font-semibold text-muted-foreground border-r border-border shrink-0">
                  Horário
                </div>
                
                {view === "day" ? (
                  employees.map((emp) => (
                    <div key={emp.id} className="flex-1 p-3 text-center border-r border-border last:border-r-0 flex items-center justify-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm truncate">{emp.name}</span>
                    </div>
                  ))
                ) : (
                  weekDays.map((day, idx) => (
                    <div key={idx} className="flex-1 p-3 text-center border-r border-border last:border-r-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground capitalize">{format(day, "EEEE", { locale: ptBR })}</span>
                      <span className={`font-semibold text-sm ${format(day, "d") === format(new Date(), "d") ? "bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center mt-1" : "mt-1"}`}>
                        {format(day, "d")}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* LINHAS DE HORÁRIOS */}
              <div className="flex-1 overflow-y-auto relative">
                {HOURS.map((hour) => (
                  <div key={hour} className="flex border-b border-border last:border-b-0 min-h-[90px] group">
                    <div className="w-[80px] p-2 text-center text-xs font-medium text-muted-foreground border-r border-border bg-muted/20 shrink-0">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    
                    {view === "day" ? (
                      employees.map((emp) => {
                        const appointment = appointments.find(a => 
                          (a.assignee_id === emp.id || (a.assignee_id === null && emp.role === "owner")) && 
                          isSameDay(parseISO(a.start_time), currentDate) &&
                          parseISO(a.start_time).getHours() === hour
                        );
                        return <Cell key={emp.id} appointment={appointment} onClick={openApptDetails} />;
                      })
                    ) : (
                      weekDays.map((day, idx) => {
                        const dayAppointments = appointments.filter(a => 
                          isSameDay(parseISO(a.start_time), day) &&
                          parseISO(a.start_time).getHours() === hour &&
                          (selectedEmployee === "all" || a.assignee_id === selectedEmployee)
                        );
                        
                        return (
                          <div key={idx} className="flex-1 border-r border-border last:border-r-0 p-1 hover:bg-muted/30 transition-colors relative flex gap-1">
                            {dayAppointments.map(app => (
                              <CompactCell key={app.id} appointment={app} onClick={openApptDetails} />
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* DIALOG DE DETALHES DO AGENDAMENTO */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Visualize os detalhes deste horário.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppt && !isRescheduling && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold col-span-1 text-right text-sm">Cliente:</span>
                <span className="col-span-3 text-sm">
                  {selectedAppt.contacts?.name || 
                    (selectedAppt.notes.includes("Cliente:") ? selectedAppt.notes.split("Cliente:")[1].split("|")[0].trim() : "Cliente Desconhecido")}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold col-span-1 text-right text-sm">Profissional:</span>
                <span className="col-span-3 text-sm">
                  {employees.find(e => e.id === selectedAppt.assignee_id)?.name || "Nenhum selecionado"}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold col-span-1 text-right text-sm">Horário:</span>
                <span className="col-span-3 text-sm text-primary font-medium">
                  {format(parseISO(selectedAppt.start_time), "dd/MM/yyyy 'às' HH:mm")}
                </span>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <span className="font-semibold col-span-1 text-right text-sm">Notas:</span>
                <span className="col-span-3 text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedAppt.notes || "Nenhuma nota inserida."}
                </span>
              </div>
            </div>
          )}

          {selectedAppt && isRescheduling && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="resched-employee">Profissional</Label>
                <select
                  id="resched-employee"
                  value={rescheduleData.employeeId}
                  onChange={e => setRescheduleData({...rescheduleData, employeeId: e.target.value})}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="" disabled>Selecione o profissional</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="resched-date">Nova Data</Label>
                  <Input 
                    id="resched-date" 
                    type="date" 
                    value={rescheduleData.date}
                    onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resched-time">Novo Horário</Label>
                  <Input 
                    id="resched-time" 
                    type="time" 
                    value={rescheduleData.time}
                    onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-between w-full sm:justify-between items-center">
            {isRescheduling ? (
              <>
                <Button variant="ghost" onClick={() => setIsRescheduling(false)} disabled={rescheduling}>Voltar</Button>
                <Button onClick={handleReschedule} disabled={rescheduling}>
                  {rescheduling ? "Salvando..." : "Confirmar Novo Horário"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={handleDeleteAppointment} disabled={deleting}>
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </Button>
                <Button variant="secondary" onClick={() => setIsRescheduling(true)}>
                  <CalendarClock className="h-4 w-4 mr-2" /> Remarcar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Cell({ appointment, onClick }: { appointment: any, onClick: (appt: any) => void }) {
  if (!appointment) return <div className="flex-1 border-r border-border last:border-r-0 p-1 hover:bg-muted/30 transition-colors relative" />;

  const contactName = appointment.contacts?.name || (appointment.notes?.includes("Cliente:") ? appointment.notes.split("Cliente:")[1].split("|")[0].trim() : "Cliente");
  const isManual = appointment.notes?.includes("[Agendado Manualmente]");
  const isWhatsApp = appointment.notes?.includes("[Agendado via WhatsApp]") || appointment.notes?.toLowerCase().includes("whatsapp");

  return (
    <div 
       className="flex-1 border-r border-border last:border-r-0 p-1 hover:bg-muted/30 transition-colors relative cursor-pointer"
       onClick={() => onClick(appointment)}
    >
      <div className="absolute inset-x-1 top-1 bottom-1 rounded-md bg-primary/10 border border-primary/20 p-2 shadow-sm overflow-hidden flex flex-col justify-start">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-primary">{format(parseISO(appointment.start_time), "HH:mm")}</span>
          {isWhatsApp && <span className="text-[9px] bg-green-500/20 text-green-700 px-1 rounded">WhatsApp</span>}
          {isManual && <span className="text-[9px] bg-blue-500/20 text-blue-700 px-1 rounded">Manual</span>}
        </div>
        <span className="text-[11px] font-semibold text-foreground truncate">{contactName}</span>
        <span className="text-[10px] text-primary/70 line-clamp-1" title={appointment.notes}>
          {appointment.notes?.replace(/\[.*?\]/, "").replace("Agendado via WhatsApp", "").trim() || "Ocupado"}
        </span>
      </div>
    </div>
  );
}

function CompactCell({ appointment, onClick }: { appointment: any, onClick: (appt: any) => void }) {
  const contactName = appointment.contacts?.name || (appointment.notes?.includes("Cliente:") ? appointment.notes.split("Cliente:")[1].split("|")[0].trim() : "Cliente");
  
  return (
    <div 
      className="flex-1 rounded-md bg-primary/10 border border-primary/20 p-1 shadow-sm overflow-hidden flex flex-col justify-center min-w-[50px] cursor-pointer hover:bg-primary/20 transition-colors"
      onClick={() => onClick(appointment)}
    >
      <span className="text-[10px] font-bold text-primary truncate">{format(parseISO(appointment.start_time), "HH:mm")}</span>
      <span className="text-[9px] font-semibold text-foreground truncate">{contactName}</span>
      <span className="text-[8px] text-primary/80 truncate" title={appointment.notes}>
        {appointment.notes?.replace(/\[.*?\]/, "").replace("Agendado via WhatsApp", "").replace(/[()]/g, "").trim() || "Ocupado"}
      </span>
    </div>
  );
}

// Helper utils 
function addHours(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + amount);
  return result;
}
