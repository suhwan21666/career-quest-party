// 서버 검증 규칙 (순수 함수 · 의존성 없음). 앱의 경험치 규칙과 1:1로 맞춰 둔 "기준 구현"이에요.
// 서버(Edge Function 등)는 클라이언트가 보낸 이벤트를 이 함수로 다시 계산해서, 맞을 때만 저장해요.
// 앱 규칙이 바뀌면 RULES_VERSION과 아래 상수를 함께 바꾸세요.
'use strict';
const RULES_VERSION = 1;
const XPREQ = l => Math.floor(90 * Math.pow(1.13, l - 1));
const BASE = { act: 15, story: 12, com: 10 };               // 퀘스트 종류별 기본 XP
const HABIT = { normal: 12, mini: 8, directMul: 1.5 };
const FIXED = { clear: 10, achieve: 20, week: 30, snack: 3, chest: 25, stamp: 3, cheer_out: 1, place: 4 };
const MILE = { 3: 8, 7: 20, 14: 35, 30: 70 };
const CHEER_GET = 2;
const MAX_MULT = 1.3;                                       // 1 + min(.3, streak*.05)
const LIMITS = { quest: 5, clear: 1, habit: 6, achieve: 6, week: 1, snack: 5, chest: 1, cheer_out: 20, cheer_in: 20, stamp: 3, place: 6, milestone: 6 };
// 하루(KST) 한 종류당 허용 개수. 값은 앱 동작에서 나온 "넉넉한 상한"이며, 넘으면 의심으로 표시해요.

function lvInfo(total) { let l = 1, r = total; while (r >= XPREQ(l)) { r -= XPREQ(l); l++; } return { l, cur: r, need: XPREQ(l) }; }
const validMult = m => typeof m === 'number' && m >= 1 && m <= MAX_MULT + 1e-9 && Math.abs(m * 20 - Math.round(m * 20)) < 1e-6; // 0.05 단위

function expectedBase(e) {
  switch (e.k) {
    case 'quest': return BASE[e.q];
    case 'habit': return Math.round((e.mini ? HABIT.mini : HABIT.normal) * (e.kd === '직접' ? HABIT.directMul : 1));
    case 'achieve': case 'clear': case 'place': return FIXED[e.k];
    default: return undefined;
  }
}

// 이벤트 하나를 검사해서 문제 목록을 돌려줘요. 빈 배열이면 통과.
function checkEvent(e) {
  const bad = [];
  if (!e || typeof e !== 'object') return ['not-object'];
  if (!Number.isInteger(e.i) || e.i < 1) bad.push('bad-seq');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.d || '')) bad.push('bad-date');
  if (!Number.isInteger(e.x) || e.x < 0 || e.x > 500) bad.push('bad-xp');
  const k = e.k;
  if (['quest', 'habit', 'achieve', 'clear', 'place'].includes(k)) {
    const b = expectedBase(e);
    if (b === undefined) bad.push('unknown-base');
    else {
      if (e.b !== b) bad.push('base-mismatch');
      if (!validMult(e.m)) bad.push('bad-mult');
      else if (Math.round(b * e.m) !== e.x && Math.round(Math.round(b) * e.m) !== e.x) bad.push('xp-mismatch');
    }
  } else if (k === 'milestone') { if (MILE[e.n] !== e.x) bad.push('xp-mismatch'); }
  else if (k === 'cheer_in') { if (!(e.n >= 1 && e.n <= 20) || e.x !== e.n * CHEER_GET) bad.push('xp-mismatch'); }
  else if (k in FIXED) { if (e.x !== FIXED[k]) bad.push('xp-mismatch'); }
  else bad.push('unknown-kind');
  return bad;
}

// 이벤트 목록 전체를 다시 계산. evBase(앱이 보낸 과거 합계)에서 출발해 totalXp·레벨을 구해요.
// 반환: {ok, totalXp, level, flags:[{i,why}], perDay}
function replay({ evBase = 0, events }) {
  const flags = [], perDay = {};
  let total = Math.max(0, evBase | 0), last = 0, ok = true;
  for (const e of events) {
    const bad = checkEvent(e);
    if (e && e.i <= last) bad.push('seq-not-increasing');   // 번호는 항상 증가, 중복(멱등) 처리는 호출 측에서
    bad.forEach(why => flags.push({ i: e && e.i, why }));
    if (e && Number.isInteger(e.i)) last = Math.max(last, e.i);
    if (bad.length) { ok = false; continue; }                  // 검증 실패 이벤트는 합산하지 않음
    const key = e.d + '|' + e.k; perDay[key] = (perDay[key] || 0) + 1;
    if (perDay[key] > (LIMITS[e.k] || 0)) { flags.push({ i: e.i, why: 'daily-limit:' + e.k }); ok = false; continue; }
    total += e.x;
  }
  return { ok, totalXp: total, level: lvInfo(total).l, flags, perDay };
}
module.exports = { RULES_VERSION, XPREQ, lvInfo, checkEvent, replay, LIMITS, MAX_MULT };
