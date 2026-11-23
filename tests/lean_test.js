const {chromium,devices}=require('playwright');const path=require('path');let f=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?' '+x:''));if(!c)f++};
(async()=>{const b=await chromium.launch();
for(const [dn,dev] of [['iph',devices['iPhone 13']],['desk',{viewport:{width:1000,height:800}}]]){
const c=await b.newContext({...dev,timezoneId:'Asia/Seoul'});const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+path.resolve('out/career-quest-party.html'));await p.waitForTimeout(400);
await p.fill('#nk','테스터');await p.click('[data-a=next]');
ok(await p.locator('[data-a=sel]').count()===8,dn+' 직업 8개만 선택 가능');
await p.click('[data-a=sel][data-j=marketer]');await p.click('[data-a=start]');await p.waitForTimeout(700);
ok(await p.locator('.world').count()===0,dn+' 광장이 자동으로 열리지 않음');
const t=await p.locator('#app').innerText();
ok(!/틈새|보물상자|더 해보기|생활 장소|광화문/.test(t),dn+' 오늘 탭에서 정리된 기능 없음');
ok(/오늘의 퀘스트/.test(t),dn+' 오늘의 퀘스트 있음');
ok((await p.locator('nav.tabs').innerText()).replace(/[\s0-9]/g,'')==='오늘파티나',dn+' 메뉴 3개: 오늘/파티/나');
await p.click('[data-a=tab][data-t=party]');await p.waitForTimeout(200);
ok(!/광화문|생활 장소/.test(await p.locator('#app').innerText())&&await p.locator('.chest').count()>0,dn+' 파티 탭: 광장 없이 파티만');
await p.click('[data-a=tab][data-t=me]');await p.waitForTimeout(200);await p.click('[data-a=fold][data-k=set]');await p.waitForTimeout(150);
ok(!/장소 습관 알림/.test(await p.locator('#app').innerText()),dn+' 설정에 장소 알림 없음');
// 예전에 다른 직업(요리사)이었던 사용자는 계속 사용 가능
await p.evaluate(()=>{});
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),dn+' 가로 넘침 없음');ok(!e.length,dn+' 오류 없음',e.join('|'));
const c2=await b.newContext({...dev,timezoneId:'Asia/Seoul'});const p2=await c2.newPage();
await p2.addInitScript(()=>{localStorage.setItem('cq-party-v1',JSON.stringify({v:2,nick:'예전',job:'chef',look:{hair:1,hc:1,top:2,skin:1},totalXp:50}))});
await p2.goto('file://'+path.resolve('out/career-quest-party.html'));await p2.waitForTimeout(500);
ok(/오늘의 퀘스트/.test(await p2.locator('#app').innerText()),dn+' 예전 직업(요리사) 저장 사용자도 정상');
await c.close();await c2.close()}
await b.close();process.exit(f?1:0)})();
