import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Followup =
  Database["public"]["Functions"]["coach_fitness_followup"]["Returns"][number];
const labels: Record<string, string> = {
  sem_primeira: "Sem primeira sessão",
  sem_retorno: "Sem conclusão há 14 dias ou mais",
  recente: "Conclusão recente",
};
const date = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
});

export function FitnessFollowup({
  organizationId,
}: {
  organizationId: string;
}) {
  const [rows, setRows] = useState<Followup[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState("atencao");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setRows(null);
    void supabase.rpc("coach_fitness_followup", { p_org: organizationId }).then(
      ({ data, error }) => {
        if (!active) return;
        setFailed(Boolean(error));
        setRows(data);
      },
      () => {
        if (active) {
          setFailed(true);
          setRows(null);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [organizationId, refresh]);

  const filtered = rows?.filter(
    (row) =>
      filter === "todos" ||
      (filter === "atencao"
        ? row.acompanhamento !== "recente"
        : row.acompanhamento === filter),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acompanhamento de treinos publicados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label>
            Mostrar
            <select
              className="ml-2 rounded border bg-background p-1"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="atencao">Precisam de atenção</option>
              <option value="sem_primeira">Sem primeira sessão</option>
              <option value="sem_retorno">Sem retorno recente</option>
              <option value="recente">Conclusão recente</option>
              <option value="todos">Todos os treinos vigentes</option>
            </select>
          </label>
          <Button
            variant="outline"
            size="sm"
            disabled={rows === null && !failed}
            onClick={() => setRefresh((value) => value + 1)}
          >
            Atualizar
          </Button>
        </div>
        {failed ? (
          <p role="alert">Não foi possível carregar o acompanhamento.</p>
        ) : !filtered ? (
          <p role="status">Carregando acompanhamento…</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum treino vigente neste filtro.
          </p>
        ) : (
          <ul className="divide-y">
            {filtered.map((row) => (
              <li
                key={row.aluno_id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div>
                  <p className="font-medium">{row.aluno_nome}</p>
                  <p className="text-muted-foreground">
                    {row.treino_nome} · {row.sessoes_concluidas} sessões
                    concluídas neste plano
                  </p>
                  {row.ultima_sessao && (
                    <p className="text-muted-foreground">
                      Última conclusão em{" "}
                      {date.format(new Date(row.ultima_sessao))}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      row.acompanhamento === "recente" ? "default" : "outline"
                    }
                  >
                    {labels[row.acompanhamento]}
                  </Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link to={"/coach?student=" + row.aluno_id}>
                      Abrir atendimento
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
