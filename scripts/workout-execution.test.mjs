import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
const { outputText } = ts.transpileModule(
  readFileSync(new URL("../src/lib/workout.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  },
);
const { validateWorkout, publicationPayload, validSessionProgress } =
  await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
const main = {
  key: "1",
  exercicio_id: "main",
  nome: "Principal",
  dia_semana: 1,
  series: 3,
  repeticoes: "10",
  carga_kg: "20",
  descanso_seg: 60,
  observacoes: "",
};
const alt = {
  exercicio_id: "alternative",
  nome: "Alternativa",
  series: 2,
  repeticoes: "15",
  carga_kg: "",
  descanso_seg: 30,
  observacoes: "Orientação própria",
};
const draft = (ex) => ({
  requestId: "r",
  aluno_id: "s",
  nome: "Treino",
  objetivo: "Força",
  nivel: "iniciante",
  data_inicio: "2026-11-10",
  semanas: 4,
  exercicios: [ex, main, main],
});
test("alternative uses its own load and parameters, not the main prescription", () => {
  const d = draft({ ...main, alternativas: [alt] });
  assert.equal(validateWorkout(d), null);
  const a = publicationPayload(d).exercicios[0].alternativas[0];
  assert.equal(a.carga_kg, null);
  assert.equal(a.series, 2);
  assert.equal(a.descanso_seg, 30);
  assert.equal(a.repeticoes, "15");
});
test("invalid, repeated and self alternatives cannot be published", () => {
  for (const alternatives of [
    [{ ...alt, series: 0 }],
    [{ ...alt, carga_kg: "NaN" }],
    [{ ...alt, repeticoes: "" }],
    [alt, alt],
    [{ ...alt, exercicio_id: "main" }],
  ])
    assert.ok(validateWorkout(draft({ ...main, alternativas: alternatives })));
});
test("old drafts without alternatives keep the publication payload shape for exact retries", () => {
  assert.ok(
    !Object.hasOwn(
      publicationPayload(draft(main)).exercicios[0],
      "alternativas",
    ),
  );
});

test("recovery rejects unknown exercises, invalid types and unapproved alternatives", () => {
  const exercises = [{ id: "one", alternativas: [{ exercicio_id: "alt" }] }];
  assert.equal(
    validSessionProgress(
      { one: { completed: false, carga: "", alternative_id: "alt" } },
      exercises,
    ),
    true,
  );
  for (const value of [
    { other: { completed: true, carga: "0" } },
    { one: { completed: "true", carga: "0" } },
    { one: { completed: true, carga: {} } },
    { one: { completed: true, carga: "0", alternative_id: "foreign" } },
    [],
  ])
    assert.equal(validSessionProgress(value, exercises), false);
});
