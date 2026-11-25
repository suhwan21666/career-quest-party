// 종단 시험: 실제 앱(브라우저) → 어댑터 → HTTP → 서버 규칙 → Postgres
const { chromium, devices } = require('playwright'); const path = require('path'); const { start } = require('./dev_server.js');
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (x ? '  ' + x : '')); if (!c) fails++; };
const APP = 'file://' + path.resolve(process.argv[2] || '../../out/career-quest-party.html'), UID = '33333333-3333-3333-3333-333333333333';
(async () => {
  const srv = await start(8787); await srv.pool.query('delete from public.profiles where user_id=$1', [UID]); await srv.pool.query('delete from auth.users where id=$1', [UID]); await srv.pool.query("insert into auth.users(id,email) values ($1,'e2e@x')", [UID]);
  const b = await chromium.launch(); const c = await b.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Seoul' }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(({ uid }) => { window.__cqNoPlaza = 1; window.__cqNoFb = 1; window.__cqFeatAll = 1; window.CQ_API_CFG = { url: 'http://127.0.0.1:8787/sync-events', token: () => window.__tok === undefined ? uid : window.__tok }; }, { uid: UID });
  await p.addInitScript({ path: path.resolve(__dirname, '../adapter/cq-api.js') });
  await p.goto(APP); await p.waitForTimeout(400);
  await p.fill('#nk', 'E2E'); await p.click('[data-a=next]'); await p.click('[data-a=sel][data-j=developer]'); await p.click('[data-a=start]'); await p.waitForTimeout(800);
  await p.evaluate(() => { const D = CQ_DEV.hab, d = D.KST(); D.S.hab = 'developer:0'; D.S.habs['developer:0'] = { streak: 2, best: 2, total: 2, last: D.prevDay(d), days: [] }; D.S.streak = 4; D.save() }); await p.reload(); await p.waitForTimeout(700);
  const hb = p.locator('[data-a=hab][data-m="0"]').first(); if (await hb.count()) { await hb.click(); await p.waitForTimeout(600); if (await p.locator('.sheet [data-a=close]').count()) await p.click('.sheet [data-a=close]').catch(() => { }); }
  for (let n = 0; n < 6; n++) { const q = p.locator('[data-a=done]').first(); if (!await q.count()) break; await q.click(); await p.waitForTimeout(500); if (await p.locator('.sheet [data-a=close]').count()) await p.click('.sheet [data-a=close]').catch(() => { }); }
  await p.waitForTimeout(3500);
  const app = await p.evaluate(() => { const e = CQ_DEV.hab.evState(); return { xp: e.totalXp, n: e.ev.length, sent: e.evSent, N: e.evN, cid: e.cid, kinds: e.ev.map(x => x.k).join(',') } });
  const db = (await srv.pool.query('select public.user_total_xp($1::uuid) t, (select count(*) from xp_events where user_id=$1 and verified)::int v, (select count(*) from xp_events where user_id=$1 and not verified)::int bad', [UID])).rows[0];
  ok(app.n >= 3, '앱에서 이벤트 발생', app.kinds);
  ok(app.sent === app.N, '앱이 서버 확인(acked)을 받아 전송 완료 처리', app.sent + '/' + app.N);
  ok(Number(db.t) === app.xp && db.v === app.n && db.bad === 0, '서버가 인정한 총 경험치 = 앱 경험치', `app=${app.xp} server=${db.t} rows=${db.v}`);
  // 서버 오류 → 보류 → 복구
  await p.evaluate(() => { window.__tok = ''; const D = CQ_DEV.hab; D.S.ev.push({ i: D.S.evN + 1, ts: Date.now(), d: D.KST(), k: 'snack', x: 3 }); D.S.evN++; D.S.totalXp += 3; D.save() }); await p.waitForTimeout(3000);
  let s = await p.evaluate(() => CQ_DEV.hab.evState()); ok(s.evSent < s.evN, '인증 실패(401)면 앱이 보류', s.evSent + '/' + s.evN);
  await p.evaluate(() => { delete window.__tok; window.__tok = undefined; CQ_DEV.hab.save() }); await p.waitForTimeout(3000);
  s = await p.evaluate(() => CQ_DEV.hab.evState()); const t2 = (await srv.pool.query('select public.user_total_xp($1::uuid) t', [UID])).rows[0].t;
  ok(s.evSent === s.evN && Number(t2) === s.totalXp, '인증 복구 후 자동 재전송·총합 일치', `app=${s.totalXp} server=${t2}`);
  // 앱을 조작해 경험치를 부풀림
  await p.evaluate(() => { const D = CQ_DEV.hab; D.S.ev.push({ i: D.S.evN + 1, ts: Date.now(), d: D.KST(), k: 'quest', x: 400, q: 'act', b: 15, m: 1 }); D.S.evN++; D.S.totalXp += 400; D.save() }); await p.waitForTimeout(3000);
  s = await p.evaluate(() => CQ_DEV.hab.evState()); const t3 = (await srv.pool.query('select public.user_total_xp($1::uuid) t, (select count(*) from xp_events where user_id=$1 and not verified)::int bad', [UID])).rows[0];
  ok(Number(t3.t) === Number(t2) && t3.bad === 1 && s.totalXp === Number(t2) + 400, '앱을 조작해 +400 XP 해도 서버 총합은 그대로, 기록만 의심으로 남음', `app=${s.totalXp} server=${t3.t}`);
  ok(s.evSent === s.evN, '조작 이벤트도 확인 처리되어 무한 재시도 없음');
  console.log('errs', errs); ok(errs.length === 0, '앱 오류 없음'); console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close(); await srv.close(); await srv.pool.end(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2) });
