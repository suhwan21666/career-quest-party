// sync-events 의 핵심 로직. DB 는 최소 인터페이스 db.tx(async q=>{ await q(sql, params) → {rows} })만 알아요.
// Node(pg)로 시험했고, Supabase Edge Function(Deno)에서는 index.ts 가 같은 인터페이스를 맞춰 줘요.
'use strict';
const R = require('./rules.js');
const MAX_BATCH = 200;

async function syncEvents(db, userId, body) {
  if (!/^[0-9a-f-]{36}$/i.test(userId || '')) return { status: 401, error: 'no-user' };
  const { cid, build, evBase, events } = body || {};
  if (typeof cid !== 'string' || !/^c_[a-z0-9]{6,32}$/.test(cid)) return { status: 400, error: 'bad-cid' };
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_BATCH) return { status: 400, error: 'bad-batch' };
  const base = Number.isInteger(evBase) && evBase >= 0 && evBase <= 1e7 ? evBase : 0;

  return db.tx(async (q) => {
    await q('select pg_advisory_xact_lock(hashtext($1))', [userId]);          // 같은 사용자 동시 요청 직렬화
    await q('insert into public.profiles(user_id) values ($1) on conflict do nothing', [userId]);
    await q('insert into public.characters(user_id) values ($1) on conflict do nothing', [userId]);
    // 기기(cid) 연결: 처음이면 기준선과 함께 등록, 다른 계정이 이미 썼으면 거부
    const own = (await q('select user_id from public.client_links where client_id=$1', [cid])).rows[0];
    if (own && own.user_id !== userId) return { status: 409, error: 'cid-owned-by-other' };
    if (!own) await q('insert into public.client_links(client_id,user_id,baseline_xp) values ($1,$2,$3)', [cid, userId, base]);

    const seen = new Set((await q('select seq from public.xp_events where user_id=$1 and client_id=$2 and seq = any($3::int[])', [userId, cid, events.map(e => e && e.i | 0)])).rows.map(r => r.seq));
    let last = (await q('select coalesce(max(seq),0) m from public.xp_events where user_id=$1 and client_id=$2', [userId, cid])).rows[0].m;
    const days = [...new Set(events.map(e => e && e.d).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d || '')))];
    const cnt = {};                                                          // 이미 저장된 하루·종류별 (검증 통과분) 개수
    if (days.length) (await q("select to_char(day,'YYYY-MM-DD') d, kind, count(*)::int n from public.xp_events where user_id=$1 and verified and day = any($2::date[]) group by 1,2", [userId, days])).rows.forEach(r => { cnt[r.d + '|' + r.kind] = r.n; });

    const out = { ok: true, accepted: 0, duplicate: 0, rejected: [], acked: 0 };
    for (const e of events) {
      const i = e && Number.isInteger(e.i) ? e.i : null;
      if (i !== null && seen.has(i)) { out.duplicate++; out.acked = Math.max(out.acked, i); continue; }
      let why = R.checkEvent(e);
      if (!why.length && e.i <= last) why = ['seq-not-increasing'];
      if (!why.length) { const key = e.d + '|' + e.k; if ((cnt[key] || 0) + 1 > (R.LIMITS[e.k] || 0)) why = ['daily-limit:' + e.k]; }
      if (i === null || !/^\d{4}-\d{2}-\d{2}$/.test(e && e.d || '') || !Number.isInteger(e.x)) { out.rejected.push({ i, why: why.length ? why : ['malformed'] }); continue; }   // 저장할 수 없는 형태
      const meta = {}; for (const k of ['q', 'j', 'h', 'kd', 'mini', 'b', 'm', 'n']) if (e[k] !== undefined) meta[k] = e[k];
      const ok = why.length === 0;
      await q('insert into public.xp_events(user_id,client_id,seq,event_key,day,kind,xp,meta,verified,flag) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (user_id,event_key) do nothing',
        [userId, cid, i, cid + ':' + i, e.d, String(e.k).slice(0, 24), Math.min(Math.max(e.x, 0), 500), meta, ok, ok ? null : why.join(',')]);
      if (ok) { out.accepted++; const key = e.d + '|' + e.k; cnt[key] = (cnt[key] || 0) + 1; } else out.rejected.push({ i, why });
      last = Math.max(last, i); out.acked = Math.max(out.acked, i);           // 거부된 이벤트도 확인 처리해야 앱이 무한 재시도하지 않아요
    }
    out.totalXp = Number((await q('select public.user_total_xp($1::uuid) t', [userId])).rows[0].t);
    out.level = R.lvInfo(out.totalXp).l;
    out.rulesVersion = R.RULES_VERSION;
    return out;
  });
}
module.exports = { syncEvents, MAX_BATCH };
