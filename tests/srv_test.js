const {chromium,devices}=require('playwright');const path=require('path');let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?'  '+x:''));if(!c)fails++};
const F='file://'+path.resolve('out/career-quest-party.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],timezoneId:'Asia/Seoul'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__cqNoPlaza=1;window.__cqNoFb=1;window.__cqOpenAll=1;window.__cqFeatAll=1;window.__cqFlushMore=0;window.__sent=[];window.__fail=0;window.CQ_API={sendEvents:async x=>{if(window.__fail)throw new Error('net');window.__sent.push(JSON.parse(JSON.stringify(x)));return{ok:true}}}});
await p.goto(F);await p.waitForTimeout(400);
await p.fill('#nk','테스터');await p.click('[data-a=next]');await p.click('[data-a=sel][data-j=developer]');await p.click('[data-a=start]');await p.waitForTimeout(900);
// do a quest and a habit
const q=p.locator('[data-a=done]').first();if(await q.count()){await q.click();await p.waitForTimeout(600);if(await p.locator('.sheet [data-a=close]').count())await p.click('.sheet [data-a=close]')}
await p.waitForTimeout(1500);
let s=await p.evaluate(()=>CQ_DEV.hab.evState());
const sum=e=>e.ev.reduce((a,x)=>a+x.x,0);
ok(s.cid&&/^c_/.test(s.cid),'cid 생성',s.cid);
ok(s.ev.length>=1&&s.totalXp===s.evBase+sum(s),'totalXp = evBase + Σ이벤트',JSON.stringify({n:s.ev.length,xp:s.totalXp,k:s.ev.map(e=>e.k)}));
const sent=await p.evaluate(()=>window.__sent);
ok(sent.length>=1&&sent[0].events.every(e=>e.id.startsWith(s.cid+':')),'CQ_API.sendEvents 전송·id 멱등키',sent.length+'건');
ok(s.evSent===s.evN,'전송 완료 후 evSent 갱신',s.evSent+'/'+s.evN);
// failure → retry
await p.evaluate(()=>{window.__fail=1;const D=CQ_DEV.hab;D.S.totalXp+=0});
const before=sent.length;
await p.evaluate(()=>{const D=CQ_DEV.hab;D.S.ev.push({i:D.S.evN+1,ts:Date.now(),d:D.KST(),k:'snack',x:2});D.S.evN++;D.S.totalXp+=2;D.save()});
await p.waitForTimeout(1500);
s=await p.evaluate(()=>CQ_DEV.hab.evState());ok(s.evSent<s.evN,'전송 실패 시 보류 유지',s.evSent+'/'+s.evN);
await p.evaluate(()=>{window.__fail=0;CQ_DEV.hab.save()});await p.waitForTimeout(1500);
s=await p.evaluate(()=>CQ_DEV.hab.evState());ok(s.evSent===s.evN,'재시도 후 전송',s.evSent+'/'+s.evN);
// backup round trip
const txt=await p.evaluate(()=>CQ_DEV.hab.backupText());
const pr=await p.evaluate(t=>CQ_DEV.hab.parseBackup(t),txt);ok(pr.ok&&pr.info.nick==='테스터','백업 파싱',JSON.stringify(pr.info));
// malicious
const bad=JSON.parse(txt);bad.state.prf=[{i:'a',h:'x',d:'2026-01-01',t:'t',u:'javascript:alert(1)',p:0},{i:'b',h:'x',d:'2026-01-01',t:'ok',u:'https://example.com/a',p:1}];bad.state.evil='x';bad.state.job='__proto__';bad.images={b:'data:text/html;base64,AAAA'};
const pb=await p.evaluate(t=>CQ_DEV.hab.parseBackup(t),JSON.stringify(bad));
ok(pb.ok&&pb.prf.length===1&&pb.prf[0].i==='b'&&pb.prf[0].p===0,'악성 URL·이미지 걸러냄',JSON.stringify(pb.prf));
const e1=await p.evaluate(()=>CQ_DEV.hab.parseBackup('{bad'));const e2=await p.evaluate(()=>CQ_DEV.hab.parseBackup('{"app":"x"}'));ok(e1.err&&e2.err,'잘못된 파일 거부');
// UI import flow
await p.evaluate(()=>{CQ_DEV.hab.S.nick='바뀜'});
require('fs').writeFileSync('/tmp/bk.json',txt);
await p.click('[data-t=me]');await p.waitForTimeout(400);
const fo=p.locator('text=설정').first();if(await fo.count())await fo.click().catch(()=>{});await p.waitForTimeout(300);
ok(await p.locator('text=내 기록 백업').count()>0,'설정에 백업 섹션 표시');
await p.setInputFiles('#impfile','/tmp/bk.json');await p.waitForTimeout(500);
ok(await p.locator('.sheet:has-text("이 기록으로 바꿀까요")').count()===1,'가져오기 확인창');
await p.click('[data-a=impgo]');await p.waitForTimeout(600);
ok(await p.evaluate(()=>CQ_DEV.hab.S.nick)==='테스터','가져오기 적용(닉네임 복원)');
await p.screenshot({path:'shots6/srv_import.png'});
console.log('errs',errs);console.log(fails?'FAILS '+fails:'ALL PASS');await b.close()})()
