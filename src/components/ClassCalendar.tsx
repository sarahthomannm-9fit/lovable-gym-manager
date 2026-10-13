import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Plus } from "lucide-react";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface CalendarEntry { id: string; title: string; kind: string; starts_at: string; end_at: string; status: string; notes?: string; }
const KIND_LABELS: Record<string, string> = { aula: "Aula", particular: "Particular", evento: "Evento", visita_tecnica: "Visita técnica", plantao: "Plantão" };

export function ClassCalendar() {
  const { classes } = useSupabaseGymData();
  const { activeOrg } = useOperationalContext();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ kind: "evento", title: "", starts_at: "", end_at: "", notes: "" });

  const loadOperationalEntries = async () => {
    if (!activeOrg?.id) { setEntries([]); return; }
    const { data, error } = await (supabase as any).from("operational_calendar_entries").select("id,title,kind,starts_at,end_at,status,notes").eq("organization_id", activeOrg.id).order("starts_at");
    if (error) toast.error("Não foi possível carregar a agenda operacional", { description: error.message });
    else setEntries(data || []);
  };
  useEffect(() => { loadOperationalEntries(); }, [activeOrg?.id]);

  const classEntries: CalendarEntry[] = classes.filter((item: any) => !activeOrg || item.organization_id === activeOrg.id).map((item: any) => ({ id: `class-${item.id}`, title: item.nome, kind: "aula", starts_at: `${item.data_aula}T${item.horario_inicio}`, end_at: `${item.data_aula}T${item.horario_fim}`, status: "confirmado" }));
  const calendarEntries = [...classEntries, ...entries];
  const weekStart = startOfWeek(currentWeek, { locale: ptBR });
  const weekEnd = endOfWeek(currentWeek, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const getEntriesForDay = (date: Date) => calendarEntries.filter(item => isSameDay(parseISO(item.starts_at), date));

  const createEntry = async () => {
    if (!activeOrg?.id) return toast.error("Selecione um condomínio ou studio no contexto operacional");
    if (!newEntry.title || !newEntry.starts_at || !newEntry.end_at) return toast.error("Preencha título, início e fim");
    const { error } = await (supabase as any).from("operational_calendar_entries").insert({ organization_id: activeOrg.id, ...newEntry, status: "agendado" });
    if (error) return toast.error(error.message);
    toast.success("Item inserido na agenda operacional"); setOpen(false); setNewEntry({ kind: "evento", title: "", starts_at: "", end_at: "", notes: "" }); loadOperationalEntries();
  };

  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Calendar className="h-6 w-6 text-primary"/><div><h2 className="text-2xl font-bold">Agenda operacional</h2><p className="text-sm text-muted-foreground">{activeOrg ? activeOrg.nome : "Selecione uma organização para criar compromissos"}</p></div></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}><ChevronLeft className="h-4 w-4"/></Button><span className="text-sm font-medium">{format(weekStart, "dd MMM", { locale: ptBR })} – {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}</span><Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}><ChevronRight className="h-4 w-4"/></Button><Button variant="outline" onClick={() => setCurrentWeek(new Date())}>Hoje</Button><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button disabled={!activeOrg}><Plus className="mr-2 h-4 w-4"/>Novo item</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Agendar operação</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Tipo</Label><Select value={newEntry.kind} onValueChange={kind => setNewEntry({ ...newEntry, kind })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(KIND_LABELS).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label>Título</Label><Input value={newEntry.title} onChange={e => setNewEntry({ ...newEntry, title: e.target.value })} placeholder="Ex.: Health Day"/></div><div><Label>Início</Label><Input type="datetime-local" value={newEntry.starts_at} onChange={e => setNewEntry({ ...newEntry, starts_at: e.target.value })}/></div><div><Label>Fim</Label><Input type="datetime-local" value={newEntry.end_at} onChange={e => setNewEntry({ ...newEntry, end_at: e.target.value })}/></div><div><Label>Observações</Label><Textarea value={newEntry.notes} onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })}/></div></div><DialogFooter><Button onClick={createEntry}>Agendar</Button></DialogFooter></DialogContent></Dialog></div></div><div className="grid grid-cols-1 gap-3 md:grid-cols-7">{weekDays.map(day => { const dayEntries = getEntriesForDay(day); const today = isSameDay(day, new Date()); return <Card key={day.toISOString()} className={today ? "ring-2 ring-primary" : ""}><CardHeader className="pb-2"><CardTitle className="text-center text-sm">{format(day, "EEE dd", { locale: ptBR })}</CardTitle></CardHeader><CardContent className="space-y-2">{dayEntries.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">Livre</p> : dayEntries.map(entry => <div key={entry.id} className="rounded-md border bg-muted/40 p-2"><Badge variant={entry.kind === "aula" ? "default" : "secondary"} className="text-[10px]">{KIND_LABELS[entry.kind] || entry.kind}</Badge><p className="mt-1 text-xs font-medium">{entry.title}</p><p className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="h-3 w-3"/>{format(parseISO(entry.starts_at), "HH:mm")} – {format(parseISO(entry.end_at), "HH:mm")}</p>{entry.notes && <p className="mt-1 text-[10px] text-muted-foreground">{entry.notes}</p>}</div>)}</CardContent></Card>})}</div><div className="flex flex-wrap gap-2">{Object.entries(KIND_LABELS).map(([key,label]) => <Badge key={key} variant="outline"><MapPin className="mr-1 h-3 w-3"/>{label}</Badge>)}</div></div>;
}

