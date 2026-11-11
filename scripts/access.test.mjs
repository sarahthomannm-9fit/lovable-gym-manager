import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/access.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { canAccessContext, pickPrimaryRole } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const base = { isAdmin: false, hasActiveOrg: true, activeRole: 'user', primaryRole: 'professor', membershipCount: 2, allow: ['professor'] };

test('a global coach role cannot authorize the resident context', () => assert.equal(canAccessContext(base), false));
test('the role in the active organization authorizes its own route', () => assert.equal(canAccessContext({ ...base, activeRole: 'professor' }), true));
test('multiple memberships without an active context require selection', () => assert.equal(canAccessContext({ ...base, hasActiveOrg: false, activeRole: 'professor' }), false));
test('a legacy account without memberships must select an authorized context', () => assert.equal(canAccessContext({ ...base, hasActiveOrg: false, membershipCount: 0 }), false));
test('a resident cannot enter staff modules', () => assert.equal(canAccessContext({ ...base, primaryRole: 'user', allow: ['admin', 'manager', 'professor'] }), false));
test('admin can preview personas', () => assert.equal(canAccessContext({ ...base, isAdmin: true }), true));
test('a context with no role fails closed', () => assert.equal(canAccessContext({ ...base, activeRole: null }), false));

test('multiple roles authorize only within the selected organization', () => assert.equal(canAccessContext({...base,contextRoles:['user','professor']}),true));
test('an empty context role list fails closed', () => assert.equal(canAccessContext({...base,activeRole:'professor',contextRoles:[]}),false));
test('primary role is deterministic for accounts with multiple roles', () => assert.equal(pickPrimaryRole(['user','professor','admin']),'admin'));
test('unknown roles do not authorize a default role', () => assert.equal(pickPrimaryRole(['unknown']),null));
