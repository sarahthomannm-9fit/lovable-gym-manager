import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
const { outputText } = ts.transpileModule(
  readFileSync(new URL("../src/lib/coach.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  },
);
const {
  weeksDiffer,
  activeCoachWorkout,
  currentCoachWorkout,
  workoutAttention,
  exerciseAvailability,
  validExerciseDrafts,
} = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const row = {
  semana: 1,
  exercicio_id: "e",
  dia_semana: 1,
  ordem: 1,
  series: 3,
  repeticoes: "10",
  carga_kg: 0,
  descanso_seg: 60,
};
test("same program in different weeks is repeatable; changed load or orientation blocks flattening", () => {
  assert.equal(weeksDiffer([row, { ...row, semana: 2 }]), false);
  assert.equal(weeksDiffer([row, { ...row, semana: 2, carga_kg: 1 }]), true);
  assert.equal(
    weeksDiffer([row, { ...row, semana: 2, observacoes: "Orientação" }]),
    true,
  );
});
test("future, expired, inactive and unpublished plans are not active", () => {
  const w = {
    status: "ativo",
    published: true,
    data_inicio: "2026-11-01",
    data_fim: "2026-12-01",
  };
  assert.equal(activeCoachWorkout(w, "2026-11-10"), true);
  for (const patch of [
    { status: "revisado" },
    { published: false },
    { data_inicio: "2026-11-11" },
    { data_fim: "2026-11-09" },
  ])
    assert.equal(activeCoachWorkout({ ...w, ...patch }, "2026-11-10"), false);
});
test("equipment and restrictions explain availability; bodyweight does not need inventory", () => {
  const ex = {
    ativo: true,
    equipamento: "Halteres",
    restricoes_incompativeis: [],
  };
  assert.match(exerciseAvailability(ex, [], []), /Equipamento/);
  assert.equal(exerciseAvailability(ex, ["Halteres ajustáveis"], []), "");
  assert.equal(
    exerciseAvailability({ ...ex, equipamento: "Peso corporal" }, [], []),
    "",
  );
  assert.match(
    exerciseAvailability(
      { ...ex, restricoes_incompativeis: ["joelho"] },
      ["Halteres"],
      ["lesão de joelho"],
    ),
    /Incompatibilidade/,
  );
});
test("followup uses real completion evidence and expiry priority", () => {
  const w = {
    status: "ativo",
    published: true,
    data_inicio: "2026-11-01",
    data_fim: "2026-12-20",
  };
  assert.equal(workoutAttention(w, null, "2026-11-10"), "sem_primeira");
  assert.equal(
    workoutAttention(
      w,
      { completions: 1, last_session: "2026-10-01T12:00:00Z" },
      "2026-11-10",
    ),
    "sem_retorno",
  );
  assert.equal(
    workoutAttention({ ...w, data_fim: "2026-11-12" }, null, "2026-11-10"),
    "revisao",
  );
});
test("malformed restored exercises are rejected", () =>
  assert.equal(validExerciseDrafts([{ exercicio_id: "e" }]), false));

test("current plan follows resident server ordering before creation time", () => {
  const base = { status: "ativo", published: true, data_fim: "2026-12-31" };
  const older = {
      ...base,
      id: "a",
      data_inicio: "2026-11-08",
      created_at: "2026-11-08T00:00:00Z",
    },
    backdated = {
      ...base,
      id: "b",
      data_inicio: "2026-11-01",
      created_at: "2026-11-09T00:00:00Z",
    };
  assert.equal(currentCoachWorkout([backdated, older], "2026-11-10").id, "a");
});
