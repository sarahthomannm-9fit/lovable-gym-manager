import { ReactNode } from 'react';

interface Column {
  key: string;
  label: string;
  mono?: boolean;
  render?: (value: any, row: any) => ReactNode;
}

interface DataTableProps {
  cols: Column[];
  rows: any[];
  onRow?: (row: any) => void;
}

export function DataTable({ cols, rows, onRow }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-border">
            {cols.map((c, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-mono text-[10px] tracking-wider text-muted-foreground uppercase font-semibold bg-muted"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr
              key={ri}
              onClick={() => onRow?.(r)}
              className={`border-b border-border transition-colors hover:bg-muted/50 ${onRow ? 'cursor-pointer' : ''}`}
            >
              {cols.map((c, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2.5 text-foreground align-middle ${c.mono ? 'font-mono' : ''}`}
                >
                  {c.render ? c.render(r[c.key], r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
