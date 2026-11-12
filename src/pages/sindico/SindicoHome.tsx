import { PageIntro } from "@/components/visual/LivingIdentity";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PersonaLayout, PersonaEmptyState } from "@/layouts/PersonaLayout";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { residentDate } from "@/lib/resident";
import { FitnessUsage } from "./FitnessUsage";
export default function SindicoHome() {
  const { activeOrg } = useOperationalContext();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  const search = params.get("search") || "";
  useEffect(() => {
    if (!activeOrg) {
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const { data, error } = await (supabase as any).rpc(
          "syndic_operation_overview",
          { p_org: activeOrg.id },
        );
        if (error || data?.organization_id !== activeOrg.id)
          throw error || new Error("Resposta incompatível.");
        if (live) setData(data);
      } catch (e) {
        if (live)
          setError(
            (e as Error).message || "Não foi possível consultar o condomínio.",
          );
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [activeOrg?.id, revision]);
  if (!activeOrg)
    return (
      <PersonaLayout title="Meu condomínio">
        <PersonaEmptyState />
      </PersonaLayout>
    );
  const c = data?.coverage,
    summary = data?.summary;
  const money = (value: number) =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  return (
    <PersonaLayout title="Meu condomínio">
      <div className="mx-auto max-w-5xl space-y-5">
        <PageIntro
          eyebrow="Seu condomínio · visão geral"
          title={activeOrg.nome}
          description="Acompanhe o uso da academia, os eventos e as solicitações do condomínio."
          actions={
            <Button
              disabled={loading}
              onClick={() => setRevision((v) => v + 1)}
            >
              {loading ? "Atualizando…" : "Atualizar visão geral"}
            </Button>
          }
        />
        <p className="text-xs text-muted-foreground">
          Situação cadastral: {data?.status || activeOrg.status}. Uso registrado
          e homologação são informações distintas.
        </p>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive p-4"
          >
            <p>{error}</p>
            {data && (
              <p className="text-sm">
                Os dados abaixo são da última consulta confirmada, não da
                atualização que falhou.
              </p>
            )}
          </div>
        )}
        {!data ? (
          loading ? (
            <p role="status">Consultando operação…</p>
          ) : (
            <p>
              Não há dados confirmados nesta consulta. Verifique o acesso e a
              situação operacional com a administração.
            </p>
          )
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Última consulta: {residentDate(data.as_of, true)}
            </p>
            <section
              aria-label="Indicadores do condomínio"
              className="grid gap-3 sm:grid-cols-3"
            >
              {[
                [
                  "Pessoas com conta vinculada",
                  c.people_linked,
                  "Moradores ativos, não apartamentos",
                ],
                [
                  "Cobertura das unidades",
                  c.percent == null ? "Sem base" : c.percent + "%",
                  `${c.units_linked} unidades identificadas de ${c.units_total ?? "total não configurado"}`,
                ],
                [
                  "Presenças neste mês",
                  summary.checkins_month,
                  "Check-ins diários; não são sessões concluídas",
                ],
              ].map(([title, value, hint]) => (
                <article
                  key={String(title)}
                  className="rounded-xl border bg-card p-5"
                >
                  <h2 className="text-sm text-muted-foreground">{title}</h2>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
                </article>
              ))}
            </section>
            <details className="rounded-lg border p-4">
              <summary className="min-h-11 cursor-pointer py-2">
                Como a cobertura é calculada
              </summary>
              <p className="text-sm">
                Unidades distintas de moradores ativos com conta vinculada /
                total de unidades cadastrado. Identificadores são comparados sem
                espaços excedentes e sem diferenciar maiúsculas. Não é uma
                verificação cadastral da unidade.
              </p>
              <p className="mt-2 text-sm">
                {c.without_unit} pessoa(s) vinculada(s) sem unidade informada.
                Se o total não estiver configurado ou houver mais
                identificadores de unidade do que o total, o percentual aparece
                como Sem base para revisão da administração.
              </p>
            </details>
            <section className="space-y-3 rounded-xl border p-5">
              <h2 className="text-xl font-semibold">Precisa de atenção</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  [
                    "Serviços aguardando proposta",
                    data.services_pending,
                    "/sindico/operacao?category=servicos",
                  ],
                  [
                    "Reservas aguardando registro de uso",
                    data.reservations_pending,
                    "/sindico/operacao?category=reservas",
                  ],
                  [
                    "Chamados abertos na consulta",
                    data.tickets.filter((t: any) => t.status !== "resolved")
                      .length,
                    "/sindico/operacao?category=chamados",
                  ],
                ].map(([label, count, to]) => (
                  <Link
                    key={String(to)}
                    to={String(to)}
                    className="rounded-lg border p-4 hover:border-primary"
                  >
                    <strong className="block text-2xl">{count}</strong>
                    <span className="mt-1 block text-sm">{label}</span>
                  </Link>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Chamados: até 20 registros recentes autorizados. A
                responsabilidade e os prazos seguem o atendimento registrado.
              </p>
            </section>
            <FitnessUsage key={activeOrg.id} organizationId={activeOrg.id} />
            <section className="space-y-3 rounded-xl border p-5">
              <h2 className="text-xl font-semibold">
                Próximas aulas · sete dias
              </h2>
              {!summary.classes.length ? (
                <p>Nenhuma aula publicada para este período.</p>
              ) : (
                summary.classes.map((a: any) => (
                  <article key={a.id} className="border-b py-3">
                    <h3 className="font-medium">{a.nome}</h3>
                    <p className="text-sm">
                      {residentDate(a.data)} · {a.horario_inicio?.slice(0, 5)}–
                      {a.horario_fim?.slice(0, 5)} · {a.professor}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {a.inscritos}/{a.capacidade ?? "—"} inscrições. Inscrição
                      não confirma presença.
                    </p>
                  </article>
                ))
              )}
            </section>
            <section className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="min-h-12">
                <Link to="/sindico/health-day">
                  Organizar evento e recepção
                </Link>
              </Button>
              <Button variant="outline" asChild className="min-h-12">
                <Link to="/sindico/comunicados?new=1">Preparar comunicado</Link>
              </Button>
            </section>
            <details
              open={params.get("section") === "moradores"}
              className="rounded-xl border p-5"
            >
              <summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold">
                Moradores · visão operacional
              </summary>
              <Input
                aria-label="Buscar morador"
                className="my-3"
                placeholder="Buscar pelo nome"
                value={search}
                onChange={(e) => {
                  const next = new URLSearchParams(params);
                  next.set("search", e.target.value);
                  setParams(next, { replace: true });
                }}
              />
              {summary.residents
                .filter((r: any) =>
                  r.nome.toLowerCase().includes(search.toLowerCase()),
                )
                .map((r: any) => (
                  <p key={r.id} className="border-b py-3 text-sm">
                    {r.nome} · Unidade {r.unidade || "não informada"} ·{" "}
                    {r.is_active ? "Ativo" : "Cadastro não ativo"}
                  </p>
                ))}
              {!summary.residents.length && (
                <p>
                  Nenhum cadastro disponível. Solicite apoio à administração
                  para conferir a implantação.
                </p>
              )}
            </details>
            <details className="rounded-xl border p-5">
              <summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold">
                Implantação e histórico da operação
              </summary>
              <p className="text-sm">
                O cadastro não comprova que o percurso do morador foi
                homologado. Preparação e ativação são conduzidas pela
                administração.
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  ["Moradores ativos", data.activation.moradores_ativos],
                  ["Planos dentro da validade", data.activation.treinos_ativos],
                  [
                    "Eventos futuros publicados",
                    data.activation.eventos_publicados,
                  ],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="text-xl">{value}</dd>
                  </div>
                ))}
              </dl>
              <h3 className="mt-4 font-semibold">Ações registradas</h3>
              {!data.actions.length ? (
                <p className="text-sm">
                  Nenhuma ação registrada nesta consulta.
                </p>
              ) : (
                data.actions.map((a: any) => (
                  <p key={a.id} className="border-b py-2 text-sm">
                    {a.action_label} · {residentDate(a.created_at, true)} ·{" "}
                    {a.resolved_at ? "Concluída" : "Em acompanhamento"}
                  </p>
                ))
              )}
            </details>
            {data.can_see_financials && (
              <details className="rounded-xl border p-5">
                <summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold">
                  Financeiro autorizado
                </summary>
                <p className="text-sm">
                  Visão financeira agregada; não classifica a saúde da operação
                  fitness.
                </p>
                <p className="mt-3">
                  Recebido no mês: {money(data.financial.receita_mes)}
                </p>
                <p>
                  Pessoas com cobrança vencida: {data.financial.inadimplentes}
                </p>
                <p>
                  Valor vencido pendente:{" "}
                  {money(data.financial.valor_inadimplencia)}
                </p>
              </details>
            )}
            <section className="rounded-xl border p-5">
              <h2 className="font-semibold">Atendimento da operação</h2>
              <p className="mt-2 text-sm">
                Use Atendimento para abrir uma solicitação ou acompanhar as
                pendências do condomínio.
              </p>
              <Button className="mt-3" asChild variant="outline">
                <Link to="/sindico/operacao?category=ajuda">
                  Pedir apoio à equipe
                </Link>
              </Button>
            </section>
          </>
        )}
      </div>
    </PersonaLayout>
  );
}
