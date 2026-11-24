// 실행: node replay_test.js [fixture.json]  — 앱이 실제로 만든 이벤트를 서버 규칙으로 다시 계산해 일치하는지 확인
const R = require('./rules.js'); let fails = 0; const ok = (c, m, x) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (x ? '  ' + x : '')); if (!c) fails++; };
const fs = require('fs'), fx = process.argv[2] || __dirname + '/fixture.json';
if (fs.existsSync(fx)) { const f = JSON.parse(fs.readFileSync(fx, 'utf8')); const r = R.replay({ evBase: f.evBase, events: f.ev });
  ok(r.ok && r.totalXp === f.totalXp, '앱 이벤트 재계산 = 앱 totalXp', `server=${r.totalXp} app=${f.totalXp} events=${f.ev.length} flags=${JSON.stringify(r.flags)}`); ok(R.lvInfo(f.totalXp).l === r.level, '레벨 일치', 'Lv' + r.level); }
else console.log('SKIP fixture 없음');
const E = (o) => ({ i: 1, d: '2026-11-24', x: 15, k: 'quest', q: 'act', b: 15, m: 1, ...o });
ok(R.checkEvent(E()).length === 0, '정상 퀘스트 통과');
ok(R.checkEvent(E({ x: 150 })).includes('xp-mismatch'), '경험치 부풀리기 거부');
ok(R.checkEvent(E({ m: 2, x: 30 })).includes('bad-mult'), '배수 상한 초과 거부');
ok(R.checkEvent(E({ b: 40, x: 40 })).includes('base-mismatch'), '기본값 조작 거부');
ok(R.checkEvent(E({ k: 'hack' })).includes('unknown-kind'), '알 수 없는 종류 거부');
ok(R.checkEvent({ i: 1, d: '2026-11-24', k: 'habit', kd: '직접', mini: 0, b: 18, m: 1.3, x: 23 }).length === 0, '직접 습관 ×1.5 ×1.3 통과');
const many = Array.from({ length: 7 }, (_, n) => E({ i: n + 1 })); const rr = R.replay({ events: many });
ok(!rr.ok && rr.flags.some(f => f.why === 'daily-limit:quest') && rr.totalXp === 75, '하루 퀘스트 상한(5) 초과분 미반영', 'xp=' + rr.totalXp);
ok(!R.replay({ events: [E({ i: 3 }), E({ i: 2 })] }).ok, '번호 역행 거부');
ok(R.replay({ evBase: 100, events: [E()] }).totalXp === 115, 'evBase 합산(옛 저장 기준선)');
console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
