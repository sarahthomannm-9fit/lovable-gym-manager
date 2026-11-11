import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type UsageRow = {
  periodo: number;
  moradores: number;
  retornaram: number;
  sessoes: number;
};

export function FitnessUsage({ organizationId }: { organizationId: string }) {
  const [rows, setRows] = useState<UsageRow[] | null>(null);
  const [error, setError] = useState(false);

  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setRows(null);
    setError(false);
    void supabase
      .rpc("condominium_fitness_usage", { p_org: organizationId })
      .then(
        (result) => {
          if (!active) return;
          setError(Boolean(result.error));
          setRows(result.data);
        },
        () => {
          if (active) setError(true);
        },
      );
    return () => {
      active = false;
    };
  }, [organizationId, revision]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso da academia no app</CardTitle>
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
          Sessões concluídas por moradores deste condomínio, incluindo quem não
          participou de eventos.
        </p>
        {error ? (
          <p role="alert">Não foi possível carregar os indicadores.</p>
        ) : rows === null ? (
          <p role="status">Carregando indicadores…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <section key={row.periodo} className="rounded-md border p-3">
                <h3 className="font-medium">Últimos {row.periodo} dias</h3>
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between gap-3">
                    <dt>Moradores que concluíram treino</dt>
                    <dd>{row.moradores}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Treinaram em dois ou mais dias</dt>
                    <dd>{row.retornaram}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Sessões concluídas</dt>
                    <dd>{row.sessoes}</dd>
                  </div>
                </dl>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
