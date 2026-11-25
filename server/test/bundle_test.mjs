// 묶음(core.mjs)이 Node 에서 ESM 으로 읽히고 DB 와 함께 동작하는지
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { Pool } = require('pg');
const { handle } = await import('../functions/sync-events/core.mjs');
const pool = new Pool({ connectionString: 'postgres://postgres@/cq?host=/tmp&port=5544' });
const db = { async tx(fn) { const c = await pool.connect(); try { await c.query('begin'); const r = await fn((s, p) => c.query(s, p)); await c.query('commit'); return r; } catch (e) { await c.query('rollback'); throw e; } finally { c.release(); } } };
const uid = '44444444-4444-4444-4444-444444444444'; await pool.query("insert into auth.users(id) values ($1) on conflict do nothing", [uid]);
const ev = { i: 1, ts: 1, d: '2026-11-25', k: 'quest', x: 15, q: 'act', b: 15, m: 1 };
const r = await handle({ method: 'POST', headers: { authorization: 'Bearer ' + uid }, bodyText: JSON.stringify({ cid: 'c_b' + Date.now().toString(36), events: [ev] }) }, { db, getUserId: async () => uid });
const j = JSON.parse(r.body); const bad = await handle({ method: 'POST', headers: {}, bodyText: '{}' }, { db, getUserId: async () => null }); const opt = await handle({ method: 'OPTIONS', headers: {}, bodyText: '' }, { db, getUserId: async () => null });
const bj = await handle({ method: 'POST', headers: {}, bodyText: '{bad' }, { db, getUserId: async () => null });
const pass = r.status === 200 && j.accepted === 1 && j.totalXp >= 15 && bad.status === 401 && opt.status === 204 && bj.status === 400;
console.log((pass ? 'PASS' : 'FAIL') + ' ESM 묶음: 수락=' + j.accepted + ' 총합=' + j.totalXp + ' 무인증=' + bad.status + ' CORS=' + opt.status + ' 깨진JSON=' + bj.status); await pool.end(); process.exit(pass ? 0 : 1);
