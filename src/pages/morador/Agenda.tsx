import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PersonaLayout } from "@/layouts/PersonaLayout";
import { useAlunoVinculo } from "@/hooks/useAlunoVinculo";
import { supabase } from "@/integrations/supabase/client";
import { localDate } from "@/lib/workout";
import { residentDate, residentStatus } from "@/lib/resident";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COMMON_AREAS, RESIDENT_SERVICES } from "@/lib/operationalCatalog";
type Item = {
  id: string;
  title: string;
  at: string;
  kind: string;
  status: string;
  to: string;
  time?: string;
};
export default function MoradorAgenda() {
  const {
    aluno,
    loading: linking,
    error: linkError,
    retry,
  } = useAlunoVinculo();
  const [items, setItems] = useState<Item[]>([]),
    [errors, setErrors] = useState<string[]>([]),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    setItems([]);
    setErrors([]);
    setLoading(true);
    if (!aluno?.organization_id) {
      setLoading(false);
      return;
    }
    const db = supabase as any,
      today = localDate();
    const add = (rows: Item[]) => {
      if (live)
        setItems((old) =>
          [...old, ...rows].sort((a, b) =>
            (a.at + (a.time || "")).localeCompare(b.at + (b.time || "")),
          ),
        );
    };
    const run = async (label: string, task: () => Promise<void>) => {
      try {
        await task();
      } catch {
        if (live) setErrors((old) => [...old, label]);
      }
    };
    const get = async (query: any) => {
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    };
    void Promise.all([
      run("Aulas", async () => {
        const [a, r] = await Promise.all([
          get(
            db
              .from("aulas")
              .select("id,nome,data_aula,horario_inicio")
              .eq("organization_id", aluno.organization_id)
              .neq("status", "cancelada")
              .gte("data_aula", today)
              .order("data_aula")
              .limit(100),
          ),
          get(
            db
              .from("aulas_inscritos")
              .select("aula_id,status")
              .eq("aluno_id", aluno.id),
          ),
        ]);
        const regs = new Map(r.map((x: any) => [x.aula_id, x.status]));
        add(
          a.map((x: any) => ({
            id: "class:" + x.id,
            title: x.nome,
            at: x.data_aula,
            time: x.horario_inicio?.slice(0, 5),
            kind: "Aula",
            status: String(regs.get(x.id) || "Disponível para inscrição"),
            to: "/morador?tab=aulas",
          })),
        );
      }),
      run("Eventos", async () => {
        const [a, r] = await Promise.all([
          get(
            db
              .from("eventos_condominio")
              .select("id,nome,data_evento,horario_inicio")
              .eq("organization_id", aluno.organization_id)
              .eq("status", "publicado")
              .eq("ativo", true)
              .gte("data_evento", today)
              .order("data_evento")
              .limit(100),
          ),
          get(
            db
              .from("health_day_inscricoes")
              .select("evento_id,status")
              .eq("aluno_id", aluno.id),
          ),
        ]);
        const regs = new Map(r.map((x: any) => [x.evento_id, x.status]));
        add(
          a.map((x: any) => ({
            id: "event:" + x.id,
            title: x.nome,
            at: x.data_evento,
            time: x.horario_inicio?.slice(0, 5),
            kind: "Evento",
            status: String(regs.get(x.id) || "Disponível para inscrição"),
            to: "/morador/eventos?event=" + x.id,
          })),
        );
      }),
      run("Reservas", async () => {
        const rows = await get(
          db
            .from("area_reservations")
            .select("id,title,area_type,starts_at,status")
            .eq("aluno_id", aluno.id)
            .eq("organization_id", aluno.organization_id)
            .gte("starts_at", today + "T00:00:00-03:00")
            .order("starts_at")
            .limit(100),
        );
        add(
          rows.map((x: any) => ({
            id: "area:" + x.id,
            title: x.title + " · " + (COMMON_AREAS[x.area_type] || x.area_type),
            at: x.starts_at,
            kind: "Reserva",
            status: x.status,
            to: "/morador/operacao",
          })),
        );
      }),
      run("Serviços", async () => {
        const rows = await get(
          db
            .from("service_requests")
            .select("id,service_type,preferred_at,status")
            .eq("aluno_id", aluno.id)
            .eq("organization_id", aluno.organization_id)
            .gte("preferred_at", today + "T00:00:00-03:00")
            .order("preferred_at")
            .limit(100),
        );
        add(
          rows.map((x: any) => ({
            id: "service:" + x.id,
            title: RESIDENT_SERVICES[x.service_type] || x.service_type,
            at: x.preferred_at,
            kind:
              x.status === "confirmada"
                ? "Serviço confirmado"
                : "Serviço · horário solicitado",
            status: x.status,
            to: "/morador/operacao",
          })),
        );
      }),
      run("Profissionais", async () => {
        const { data, error } = await db
          .from("organizations")
          .select("metadata")
          .eq("id", aluno.organization_id)
          .single();
        if (error) throw error;
        if (data?.metadata?.features?.staff !== true) return;
        const rows = await get(
          db
            .from("staff_bookings")
            .select("id,professional_name,slot,integration_status")
            .eq("aluno_id", aluno.id)
            .gte("slot", today + "T00:00:00-03:00")
            .order("slot")
            .limit(100),
        );
        add(
          rows.map((x: any) => ({
            id: "staff:" + x.id,
            title: x.professional_name,
            at: x.slot,
            kind: "Profissional",
            status: x.integration_status || "Aguardando confirmação",
            to: "/morador/staff",
          })),
        );
      }),
    ]).finally(() => {
      if (live) setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [aluno?.id, aluno?.organization_id, revision]);
  return (
    <PersonaLayout
      title="Minha agenda"
      subtitle="Compromissos e atividades no condomínio"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-muted-foreground">
          Aulas e eventos disponíveis aparecem junto das suas reservas e
          solicitações. O status informa o que já está confirmado. Até 100
          próximos registros por categoria.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              retry();
              setRevision((v) => v + 1);
            }}
          >
            Atualizar agenda
          </Button>
          <Button asChild variant="outline">
            <Link to="/morador/eventos">Eventos e inscrições</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/morador/operacao">Reservas e serviços</Link>
          </Button>
        </div>
        {linking || loading ? (
          <p role="status">Carregando agenda…</p>
        ) : linkError ? (
          <p role="alert">{linkError}</p>
        ) : !aluno ? (
          <div>
            <p>Selecione o condomínio e confirme seu vínculo.</p>
            <Link className="underline" to="/select-context">
              Selecionar condomínio
            </Link>
          </div>
        ) : null}
        {errors.length > 0 && (
          <div role="alert" className="rounded-lg border p-4">
            Não foi possível consultar: {errors.join(", ")}. Os demais registros
            permanecem disponíveis. Use Atualizar agenda para tentar novamente.
          </div>
        )}
        {!loading &&
          !linking &&
          !linkError &&
          aluno &&
          !items.length &&
          !errors.length && (
            <p>Nenhum compromisso ou atividade futura disponível.</p>
          )}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="space-y-2 p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.kind}
              </p>
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p>
                {residentDate(item.at, item.at.includes("T"))}
                {item.time ? " · " + item.time : ""}
              </p>
              <p className="font-medium">
                {residentStatus[item.status] || item.status}
              </p>
              <Button asChild variant="outline">
                <Link to={item.to}>Ver detalhes e gerenciar</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PersonaLayout>
  );
}
