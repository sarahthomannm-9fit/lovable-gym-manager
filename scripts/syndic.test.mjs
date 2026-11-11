import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
const { outputText } = ts.transpileModule(
  readFileSync(new URL("../src/lib/syndic.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  },
);
const { csvCell, participantsCsv } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
test("CSV neutralizes formulas and preserves quoted text", () => {
  for (const value of ["=1+1", " +cmd", "-2", "@SUM(A1)", "\ttext", "\rvalue"])
    assert.equal(csvCell(value), "\"'" + value + '"');
  assert.equal(csvCell('A "B"'), '"A ""B"""');
  assert.equal(csvCell("A\0B"), '"AB"');
});
test("participant export contains event identity and excludes clinical fields", () => {
  const output = participantsCsv(
    { id: "event-1", nome: "Evento" },
    [
      {
        nome: "Nome",
        email: "a@example.com",
        status: "checkin",
        anamnese: "PRIVATE",
        medicamentos: "SECRET",
      },
    ],
    "2026-11-10T21:00:00Z",
  );
  assert.ok(output.startsWith("\uFEFF"));
  assert.ok(output.includes("event-1"));
  assert.ok(output.includes("2026-11-10T21:00:00Z"));
  assert.ok(!output.includes("PRIVATE"));
  assert.ok(!output.includes("SECRET"));
});
