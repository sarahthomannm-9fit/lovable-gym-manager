import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

export interface MonthlyBarDatum {
  /** Short label for the X axis, e.g. 'FEV', 'MAR' or '2026-07' formatted upstream. */
  mes: string;
  valor: number;
}

interface MonthlyBarChartProps {
  data: MonthlyBarDatum[];
  /** Hex color for the bars, matches each persona's ACCENT constant. */
  accent: string;
  /** Label shown in the tooltip, e.g. 'Faturamento' or 'Check-ins'. */
  valueLabel: string;
  /** Optional value formatter for the tooltip, e.g. currency. Defaults to plain number. */
  formatValue?: (v: number) => string;
  height?: number;
}

// Reusable "last N months" bar chart. Built for the pattern that showed up independently
// in SindicoHome (monthly revenue, currently a plain list) and CorpHome (monthly
// faturamento, also a plain list) — both already compute the same shape of data
// ({ mes, valor }[]) but never render it as a chart, unlike the FitManager Brandbook
// reference (Dashboard Executivo — Engajamento mensal, bar chart Fev-Jul).
export function MonthlyBarChart({ data, accent, valueLabel, formatValue, height = 220 }: MonthlyBarChartProps) {
  const config: ChartConfig = {
    valor: { label: valueLabel, color: accent },
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        Sem dados suficientes ainda.
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel={false}
              formatter={(value) => [
                formatValue ? formatValue(Number(value)) : String(value),
                valueLabel,
              ]}
            />
          }
        />
        <Bar dataKey="valor" fill={accent} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
