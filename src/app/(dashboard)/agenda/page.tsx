"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Plus } from "lucide-react";
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

  // Carregar Funcionários e Agendamentos
  useEffect(() => {
    if (!account?.id) return;

    async function loadData() {
      setLoading(true);
      
      // Busca funcionários
      const { data: members } = await supabase
        .from("account_members")
        .select("id, profiles(display_name)")
        .eq("account_id", account!.id);
        
      if (members) {
        setEmployees(members.map(m => ({
          id: m.id,
          name: (m.profiles as any)?.display_name || "Membro"
        })));
      }

      // Busca agendamentos da semana/dia visível
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      
      const { data: appts } = await supabase
        .from("appointments")
        .select("*")
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

  // Salvar Agendamento
  const handleSaveAppointment = async () => {
    if (!account?.id || !newAppt.clientName || !newAppt.employeeId || !newAppt.date || !newAppt.time) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      // Como não criamos um UI para buscar 'contacts' ainda, vamos criar um contato genérico ou usar notes
      // Em produção, isso seria ligado à tabela `contacts`
      
      // Cria a data de início e fim
      const startTime = new Date(`${newAppt.date}T${newAppt.time}:00-03:00`); // Fuso BR simples
      const endTime = addHours(startTime, 1); // Mock: 1 hora de duração padrão
      
      const payload = {
        account_id: account.id,
        assignee_id: newAppt.employeeId,
        contact_id: null, // Idealmente teríamos a busca de contatos aqui
        notes: `Cliente: ${newAppt.clientName} | Serviço: ${newAppt.service}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled'
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(payload)
        .select()
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
                  <div key={hour} className="flex border-b border-border last:border-b-0 min-h-[60px] group">
                    <div className="w-[80px] p-2 text-center text-xs font-medium text-muted-foreground border-r border-border bg-muted/20 shrink-0">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    
                    {view === "day" ? (
                      employees.map((emp) => {
                        const appointment = appointments.find(a => 
                          a.assignee_id === emp.id && 
                          isSameDay(parseISO(a.start_time), currentDate) &&
                          parseISO(a.start_time).getHours() === hour
                        );
                        return <Cell key={emp.id} appointment={appointment} />;
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
                              <div key={app.id} className="flex-1 rounded-md bg-primary/10 border border-primary/20 p-1 shadow-sm overflow-hidden flex flex-col justify-center min-w-[50px]">
                                <span className="text-[10px] font-bold text-primary truncate">{format(parseISO(app.start_time), "HH:mm")}</span>
                                <span className="text-[9px] text-primary/80 truncate" title={app.notes}>
                                  {app.notes || "Ocupado"}
                                </span>
                              </div>
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
    </div>
  );
}

function Cell({ appointment }: { appointment: any }) {
  return (
    <div className="flex-1 border-r border-border last:border-r-0 p-1 hover:bg-muted/30 transition-colors relative">
      {appointment && (
        <div className="absolute inset-x-2 top-1 bottom-1 rounded-md bg-primary/10 border border-primary/20 p-2 shadow-sm overflow-hidden flex flex-col justify-center">
          <span className="text-xs font-bold text-primary">{format(parseISO(appointment.start_time), "HH:mm")}</span>
          <span className="text-[11px] text-primary/70 line-clamp-2" title={appointment.notes}>{appointment.notes || "Ocupado"}</span>
        </div>
      )}
    </div>
  );
}
// Helper utils 
function addHours(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + amount);
  return result;
}
