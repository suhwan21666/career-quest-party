// 실제 Postgres 에 대한 시험. 사용: PGURL=postgres://postgres@/cq?host=/tmp&port=5544 NODE_PATH=<pg 위치> node db_test.js
const { Client, Pool } = require('pg'); const { syncEvents } = require('../sync_core.js'); const fs = require('fs');
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (x ? '  ' + x : '')); if (!c) fails++; };
const url = process.env.PGURL || 'postgres://postgres@/cq?host=/tmp&port=5544';
const pool = new Pool({ connectionString: url, max: 5 });
const db = { async tx(fn) { const c = await pool.connect(); try { await c.query('begin'); const r = await fn((s, p) => c.query(s, p)); await c.query('commit'); return r; } catch (e) { await c.query('rollback'); throw e; } finally { c.release(); } } };
const as = async (role, uid, fn) => { const c = await pool.connect(); try { await c.query('begin'); await c.query(`set local role ${role}`); if (uid) await c.query("select set_config('request.jwt.claim.sub',$1,true)", [uid]); return await fn(c); } finally { await c.query('rollback'); c.release(); } };
const fail = async (p) => { try { await p; return null } catch (e) { return e.message } };
const A = '11111111-1111-1111-1111-111111111111', Bu = '22222222-2222-2222-2222-222222222222';
const E = (o) => ({ i: 1, ts: 1, d: '2026-11-25', k: 'quest', x: 15, q: 'act', b: 15, m: 1, ...o });
(async () => {
  await pool.query('truncate public.profiles, auth.users cascade'); await pool.query("insert into auth.users(id,email) values ($1,'a@x'),($2,'b@x')", [A, Bu]);

  // ── 동기화 함수
  const fx = JSON.parse(fs.readFileSync('../fixture.json', 'utf8')); const cidA = 'c_aaaaaaaaaaaa';
  let r = await syncEvents(db, A, { cid: cidA, build: 'v0.11.0', evBase: 100, events: fx.ev.map(e => ({ ...e, id: cidA + ':' + e.i })) });
  ok(r.ok && r.accepted === fx.ev.length && r.rejected.length === 0, '앱이 만든 실제 이벤트 전부 수락', JSON.stringify({ acc: r.accepted, rej: r.rejected }));
  ok(r.totalXp === 100 + fx.totalXp - (fx.evBase || 0) && r.acked === fx.ev[fx.ev.length - 1].i, '서버 총 경험치 = 기준선(100) + 이벤트 합', 'server=' + r.totalXp);
  const before = r.totalXp;
  r = await syncEvents(db, A, { cid: cidA, build: 'v0.11.0', evBase: 100, events: fx.ev });
  ok(r.duplicate === fx.ev.length && r.accepted === 0 && r.totalXp === before, '같은 배치 재전송은 한 번만 반영(멱등)', 'dup=' + r.duplicate);
  const n0 = fx.ev[fx.ev.length - 1].i;
  r = await syncEvents(db, A, { cid: cidA, evBase: 100, events: [E({ i: n0 + 1, x: 999 }), E({ i: n0 + 2, m: 2, x: 30 }), E({ i: n0 + 3, k: 'hack' })] });
  ok(r.accepted === 0 && r.rejected.length === 3 && r.totalXp === before && r.acked === n0 + 3, '조작 이벤트 3종 거부·합산 안 됨·확인 처리됨', JSON.stringify(r.rejected.map(x => x.why[0])));
  const fl = (await pool.query("select count(*)::int n from xp_events where user_id=$1 and not verified and flag is not null", [A])).rows[0].n; ok(fl === 3, '거부 이벤트는 흔적(verified=false, flag)으로 보존', 'n=' + fl);
  r = await syncEvents(db, A, { cid: cidA, evBase: 999999, events: [E({ i: n0 + 4, d: '2026-11-26' })] });
  ok(r.accepted === 1 && r.totalXp === before + 15, '이후 evBase 를 바꿔 보내도 기준선은 처음 값 유지', 'total=' + r.totalXp);
  r = await syncEvents(db, A, { cid: cidA, events: [E({ i: 900, d: '2026-11-27' }), E({ i: 899, d: '2026-11-28' })] }); ok(r.accepted === 1 && r.rejected.length === 1 && r.rejected[0].why.includes('seq-not-increasing'), '번호 역행 거부(900 다음 899)');
  const day = Array.from({ length: 7 }, (_, k) => E({ i: 1000 + k, d: '2026-12-01' })); r = await syncEvents(db, A, { cid: cidA, events: day });
  ok(r.accepted === 5 && r.rejected.length === 2 && r.rejected[0].why[0] === 'daily-limit:quest', '하루 퀘스트 5개 초과분 거부', 'acc=' + r.accepted);
  r = await syncEvents(db, A, { cid: cidA, events: [E({ i: 2000, d: '2026-12-01' })] }); ok(r.rejected.length === 1, '다음 요청에서도 하루 상한 이어서 적용(이미 저장된 개수 포함)');
  r = await syncEvents(db, Bu, { cid: cidA, events: [E({ i: 1 })] }); ok(r.status === 409, '남의 기기 ID(cid) 가로채기 거부', r.error);
  ok((await syncEvents(db, A, { cid: 'bad', events: [E()] })).status === 400 && (await syncEvents(db, A, { cid: cidA, events: [] })).status === 400 && (await syncEvents(db, 'x', { cid: cidA, events: [E()] })).status === 401, '잘못된 입력(cid·빈 배치·사용자) 거부');
  const big = await syncEvents(db, A, { cid: cidA, events: Array.from({ length: 201 }, (_, k) => E({ i: 5000 + k })) }); ok(big.status === 400, '배치 201개 거부');
  const mal = await syncEvents(db, A, { cid: cidA, events: [null, { i: 'x' }, E({ i: 7000, d: "bad" })] }); ok(mal.ok && mal.rejected.length === 3, '깨진 이벤트(null/형식오류)도 서버가 죽지 않고 거부', JSON.stringify(mal.rejected.map(x => x.why[0])));
  // 동시 요청
  const cidC = 'c_cccccccccccc', batch = [E({ i: 1, d: '2026-12-05' }), E({ i: 2, d: '2026-12-05' })];
  const rs = await Promise.all([1, 2, 3, 4].map(() => syncEvents(db, Bu, { cid: cidC, events: batch })));
  const tot = (await pool.query('select public.user_total_xp($1::uuid) t', [Bu])).rows[0].t; const cntB = (await pool.query('select count(*)::int n from xp_events where user_id=$1', [Bu])).rows[0].n;
  ok(cntB === 2 && Number(tot) === 30, '같은 배치 동시 4건 → 이중 반영 없음', `rows=${cntB} total=${tot} accepted=${rs.map(x => x.accepted).join(',')}`);

  // ── RLS / 권한
  await pool.query("insert into public.habit_progress(user_id,habit_id,total) values ($1,'developer:0',5)", [A]);
  let n = await as('authenticated', A, async c => (await c.query('select count(*)::int n from public.habit_progress')).rows[0].n); ok(n === 1, 'A 는 자기 습관 진행을 봄');
  n = await as('authenticated', Bu, async c => (await c.query('select count(*)::int n from public.habit_progress')).rows[0].n); ok(n === 0, 'B 는 A 의 습관 진행을 못 봄');
  n = await as('authenticated', Bu, async c => (await c.query('select count(*)::int n from public.profiles')).rows[0].n); ok(n === 1, 'B 는 자기 프로필 1건만 봄(A 의 것 안 보임)');
  let e = await as('authenticated', Bu, async c => fail(c.query("insert into public.habit_notes(user_id,habit_id,day,note) values ($1,'developer:0','2026-12-01','x')", [A]))); ok(e && /row-level security/.test(e), 'B 가 A 의 이름으로 메모 쓰기 거부', e);
  e = await as('authenticated', A, async c => fail(c.query("insert into public.xp_events(user_id,client_id,seq,event_key,day,kind,xp) values ($1,'c_x',1,'k','2026-12-01','quest',500)", [A]))); ok(e && /row-level security/.test(e), '사용자가 경험치 이벤트를 직접 쓰기 거부(서버만 가능)', e);
  n = await as('authenticated', A, async c => c.query('select count(*)::int n from public.xp_events')).then(x => x.rows[0].n); ok(n > 0, 'A 는 자기 경험치 이벤트를 읽음', 'n=' + n);
  n = await as('authenticated', Bu, async c => c.query('select count(*)::int n from public.xp_events')).then(x => x.rows[0].n); ok(n === 2, 'B 는 자기 이벤트만 읽음(2건)', 'n=' + n);
  const upd = await as('authenticated', A, async c => c.query("update public.xp_events set xp=500 where user_id=$1", [A])); ok(upd.rowCount === 0, '이벤트 수정 시도는 0건 반영');
  const del = await as('authenticated', A, async c => c.query("delete from public.xp_events where user_id=$1", [A])); ok(del.rowCount === 0, '이벤트 삭제 시도는 0건 반영');
  n = await as('anon', null, async c => (await c.query('select count(*)::int n from public.profiles')).rows[0].n); ok(n === 0, '로그인 안 한 사용자는 프로필이 보이지 않음');
  n = await as('anon', null, async c => (await c.query('select count(*)::int n from public.habits')).rows[0].n); ok(n === 0, '로그인 안 한 사용자는 습관 목록도 안 보임(정책이 authenticated 한정)');
  n = await as('authenticated', A, async c => (await c.query('select count(*)::int n from public.habits')).rows[0].n); ok(n === 104, '로그인하면 습관 104개 읽기');
  e = await as('authenticated', A, async c => fail(c.query('select * from public.v_user_metrics'))); ok(e && /permission denied/.test(e), '일반 사용자는 지표 뷰 접근 거부', e);
  e = await as('anon', null, async c => fail(c.query('select * from public.v_effect_summary'))); ok(e && /permission denied/.test(e), '익명 사용자도 지표 뷰 거부');
  e = await as('authenticated', A, async c => fail(c.query('select public.user_total_xp($1::uuid)', [A]))); ok(e && /permission denied/.test(e), '일반 사용자는 총합 함수 직접 호출 거부');
  const vm = (await pool.query('select * from public.v_user_metrics where user_id=$1', [A])).rows[0]; ok(vm && vm.job_id === null, '서버 권한으로는 지표 뷰 조회 가능', JSON.stringify(vm));
  const sm = (await pool.query('select * from public.v_effect_summary')).rows[0]; ok(sm && Number(sm.users) >= 2, '효과 요약 뷰 동작', JSON.stringify(sm));
  e = await as('authenticated', A, async c => fail(c.query("insert into public.proofs(id,user_id,habit_id,day,url) values ('p1',$1,'developer:0','2026-12-01','javascript:alert(1)')", [A]))); ok(e && /check constraint/.test(e), '증빙 링크 javascript: 를 DB 가 거부', e);
  e = await as('authenticated', A, async c => fail(c.query("insert into public.habit_notes(user_id,habit_id,day,note) values ($1,'developer:0','2026-12-01',repeat('가',201))", [A]))); ok(e && /check constraint/.test(e), '메모 200자 초과를 DB 가 거부');
  e = await as('authenticated', A, async c => fail(c.query("insert into public.parties(code) values ('ABCD')"))); ok(e && /row-level security/.test(e), '사용자가 직접 파티 생성 거부(함수로만)');
  // Storage
  await pool.query("insert into storage.objects(bucket_id,name) values ('proofs',$1),('proofs',$2)", [A + '/p1.jpg', Bu + '/p2.jpg']);
  n = await as('authenticated', A, async c => (await c.query('select count(*)::int n from storage.objects')).rows[0].n); ok(n === 1, '사진 저장소: A 는 자기 폴더 파일만 보임');
  e = await as('authenticated', A, async c => fail(c.query("insert into storage.objects(bucket_id,name) values ('proofs',$1)", [Bu + '/evil.jpg']))); ok(e && /row-level security/.test(e), '사진 저장소: 남의 폴더에 쓰기 거부', e);
  // 탈퇴 연쇄 삭제
  await pool.query('delete from auth.users where id=$1', [Bu]); await pool.query('delete from public.profiles where user_id=$1', [Bu]);
  n = (await pool.query('select (select count(*) from xp_events where user_id=$1)+(select count(*) from client_links where user_id=$1) n', [Bu])).rows[0].n; ok(Number(n) === 0, '프로필 삭제 시 이벤트·기기 연결 연쇄 삭제');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await pool.end(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2) });
