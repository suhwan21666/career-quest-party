// 시험용 HTTP 서버: 진짜 Postgres + 같은 처리 로직. 인증만 가짜(토큰 = 사용자 id).
const http = require('http'), { Pool } = require('pg'), { handle } = require('../http_handler.js');
const pool = new Pool({ connectionString: process.env.PGURL || 'postgres://postgres@/cq?host=/tmp&port=5544', max: 5 });
const db = { async tx(fn) { const c = await pool.connect(); try { await c.query('begin'); const r = await fn((s, p) => c.query(s, p)); await c.query('commit'); return r; } catch (e) { await c.query('rollback'); throw e; } finally { c.release(); } } };
const getUserId = async (h) => { const m = /^Bearer ([0-9a-f-]{36})$/i.exec(h); return m ? m[1] : null; };
function start(port) { return new Promise(res => { const s = http.createServer((q, r) => { let b = ''; q.on('data', d => b += d); q.on('end', async () => { const o = await handle({ method: q.method, headers: q.headers, bodyText: b }, { db, getUserId }); r.writeHead(o.status, o.headers); r.end(o.body); }); }).listen(port, () => res({ close: () => new Promise(x => s.close(x)), pool })); }); }
module.exports = { start };
