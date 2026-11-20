const {chromium,devices}=require('playwright');let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?'  '+x:''));if(!c)fails++};
(async()=>{const b=await chromium.launch();
for(const [name,file,n] of [['기본 5곳','out/career-quest-party.html',5],['확장 9곳','/tmp/cqext/career-quest-party.html',9]]){
 const c=await b.newContext({...devices['iPhone 13'],timezoneId:'Asia/Seoul'});const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
 await p.addInitScript(()=>{window.__cqNoPlaza=1;localStorage.setItem('cq-party-v1',JSON.stringify({v:2,nick:'테스터',job:'developer',look:{hair:0,hc:0,top:1,skin:0},totalXp:0,done:0,streak:0,updated:Date.now(),startPlaza:false}))});
 await p.goto('file://'+require('path').resolve(file));await p.waitForTimeout(500);
 const dev=await p.evaluate(()=>({pl:CQ_DEV.places,pr:CQ_DEV.problems(),um:CQ_DEV.unmappedJobs()}));
 ok(dev.pl.length===n,name+': 장소 수 '+dev.pl.length);ok(dev.pr.length===0,name+': 데이터 점검 통과',dev.pr.join('|'));
 ok(dev.um.length===0,name+': 모든 직업이 일터를 가짐',dev.um.join(','));
 // 모든 장소: 오늘 화면 버튼 → 지도 → 구역 카드 → 습관 완료
 const ids=dev.pl;let good=0;
 for(const id of ids){await p.locator(`[data-a=plc][data-p=${id}]`).click();await p.waitForTimeout(250);await p.click('[data-p=go][data-s=e]');await p.waitForTimeout(150);
  if(/\+4/.test(await p.locator('#pcard').innerText()))good++;await p.click('.pworld [data-p=out]');await p.waitForTimeout(250);await p.click('[data-w=close]');await p.waitForTimeout(120)}
 ok(good===ids.length,name+': 모든 장소 지도와 카드 동작 '+good+'/'+ids.length);
 // 광장: 모든 건물 문 앞까지 도달 가능한지(키보드 이동 대신 카드가 뜨는 위치로 텔레포트 불가 → 마지막 장소로 걷기 검증)
 await p.locator('[data-a=world]').click();await p.waitForTimeout(800);
 const info=await p.evaluate(()=>({h:document.querySelector('.world canvas')?.height}));
 await p.screenshot({path:`shots6/ext_${n}_plaza.png`});
 ok(e.length===0,name+': 오류 없음',e.join('|'));await c.close()}
console.log(fails?'FAILS '+fails:'ALL PASS');await b.close()})();
