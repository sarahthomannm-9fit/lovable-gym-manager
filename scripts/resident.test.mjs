import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
const source = readFileSync(
  new URL("../src/lib/resident.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
});
const { residentDate, monthBounds, paymentPending, residentInstant } =
  await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
test("calendar date does not shift to the preceding day", () =>
  assert.equal(residentDate("2026-11-10"), "10/11/2026"));
test("instant near midnight is displayed in Sao Paulo", () =>
  assert.match(residentDate("2026-11-10T01:00:00Z", true), /09\/11\/2026/));
test("January has a previous year and December a next year", () => {
  assert.equal(monthBounds("2027-01-01").previous, "2026-12-01");
  assert.equal(monthBounds("2026-12-31").next, "2027-01-01");
});
test("cancelled and settled charges are never pending", () => {
  for (const status of ["pago", "cancelado", "cancelada", "estornado"])
    assert.equal(paymentPending(status), false);
  for (const status of ["pendente", "atrasado", "vencido"])
    assert.equal(paymentPending(status), true);
});
test("missing and invalid dates are explicit", () => {
  assert.equal(residentDate(null), "A confirmar");
  assert.equal(residentDate("invalid"), "Data indisponível");
});

test("condominium clock is independent of the device timezone", () =>
  assert.equal(
    residentInstant("2026-11-10T10:00").toISOString(),
    "2026-11-10T13:00:00.000Z",
  ));
