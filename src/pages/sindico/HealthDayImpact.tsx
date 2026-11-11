import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function HealthDayImpact({
  eventId,
  name,
}: {
  eventId: string;
  name: string;
}) {
  const [rows, setRows] = useState<ImpactRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setRows(null);
    setFailed(false);
    void supabase.rpc("health_day_impact", { p_event: eventId }).then(
      ({ data, error }) => {
        if (!active) return;
        setFailed(Boolean(error));
        setRows(data);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [eventId, revision]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impacto pós-evento · {name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRevision((v) => v + 1)}
        >
          Atualizar indicadores
        </Button>
        <p className="text-muted-foreground">
          Os períodos começam no check-in. O vínculo com uma conta é verificado
          no momento da consulta. Janelas ainda em andamento têm resultados
          parciais. Estes números descrevem uso posterior e não comprovam que o
          evento causou a prática.
        </p>
        {failed ? (
          <p role="alert">Não foi possível carregar os indicadores.</p>
        ) : rows === null ? (
          <p role="status">Carregando indicadores…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <section key={row.dias} className="rounded-md border p-3">
                <h3 className="font-medium">
                  Até {row.dias} dias após o check-in
                </h3>
                {row.presentes === 0 ? (
                  <p className="mt-2">Nenhuma presença registrada.</p>
                ) : (
                  <dl className="mt-2 space-y-1">
                    <div className="flex justify-between gap-3">
                      <dt>Já completaram o período de acompanhamento</dt>
                      <dd>
                        {row.janela_completa} de {row.presentes}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Moradores presentes</dt>
                      <dd>{row.presentes}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Com conta vinculada hoje</dt>
                      <dd>{row.contas_vinculadas}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Enviaram triagem no período</dt>
                      <dd className="shrink-0">
                        {row.triagens_enviadas} (
                        {percent.format(row.triagens_enviadas / row.presentes)})
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Receberam treino no período</dt>
                      <dd className="shrink-0">
                        {row.moradores_com_treino} (
                        {percent.format(
                          row.moradores_com_treino / row.presentes,
                        )}
                        )
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Concluíram ao menos uma sessão</dt>
                      <dd className="shrink-0">
                        {row.moradores_com_sessao} (
                        {percent.format(
                          row.moradores_com_sessao / row.presentes,
                        )}
                        )
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Treinaram em dois ou mais dias</dt>
                      <dd className="shrink-0">
                        {row.moradores_com_retorno} (
                        {percent.format(
                          row.moradores_com_retorno / row.presentes,
                        )}
                        )
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Sessões concluídas</dt>
                      <dd>{row.sessoes_concluidas}</dd>
                    </div>
                  </dl>
                )}
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type ImpactRow = {
  dias: number;
  presentes: number;
  janela_completa: number;
  contas_vinculadas: number;
  triagens_enviadas: number;
  moradores_com_treino: number;
  moradores_com_sessao: number;
  moradores_com_retorno: number;
  sessoes_concluidas: number;
};
