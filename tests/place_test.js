const {chromium,devices}=require('playwright');const path=require('path');let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?'  '+x:''));if(!c)fails++};
const F='file://'+path.resolve('out/career-quest-party.html');
const S0=(o)=>JSON.stringify({v:2,nick:'테스터',job:'developer',look:{hair:0,hc:0,top:1,skin:0},totalXp:0,done:0,streak:0,updated:Date.now(),...o});
(async()=>{const b=await chromium.launch();
for(const [dn,dev] of [['iph',devices['iPhone 13']],['desk',{viewport:{width:1000,height:800}}]]){
 const c=await b.newContext({...dev,timezoneId:'Asia/Seoul'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(F);await p.waitForTimeout(500);
 // 신규 설정 → 광장 자동 열림
 await p.fill('#nk','테스터');await p.click('[data-a=next]');await p.click('[data-a=sel][data-j=developer]');await p.click('[data-a=start]');await p.waitForTimeout(900);
 ok(await p.locator('.world:not(.pworld)').count()===1,dn+' 설정 후 광장이 먼저 열림');
 await p.screenshot({path:`shots6/pl_${dn}_plaza.png`});
 // 집 문까지 걷기: 왼쪽 1초, 아래 길게
 await p.keyboard.down('ArrowLeft');await p.waitForTimeout(1000);await p.keyboard.up('ArrowLeft');
 await p.keyboard.down("ArrowDown");await p.waitForTimeout(6000);await p.keyboard.up('ArrowDown');await p.waitForTimeout(300);
 const cardTxt=await p.locator('#wcard').innerText();ok(/집/.test(cardTxt)&&await p.locator('[data-w=enter]').count()===1,dn+' 집 문 앞에서 들어가기 카드',cardTxt.replace(/\n/g,' ').slice(0,60));
 await p.screenshot({path:`shots6/pl_${dn}_door.png`});
 await p.click('[data-w=enter]');await p.waitForTimeout(600);
 ok(await p.locator('.pworld').count()===1&&await p.locator('.world:not(.pworld)').count()===0,dn+' 집 안으로 이동(광장은 닫힘)');
 await p.click('[data-p=go][data-s=m]');await p.waitForTimeout(500);
 const hc=await p.locator('#pcard').innerText();ok(/이불 정리/.test(hc),dn+' 아침 구역 습관 표시',hc.replace(/\n/g,' ').slice(0,70));
 await p.screenshot({path:`shots6/pl_${dn}_home_m.png`});
 await p.click('[data-p=hab][data-id="home.m0"]');await p.waitForTimeout(300);
 let s=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')||localStorage.getItem(Object.keys(localStorage)[0])));
 ok(s.pl&&s.pl.ids.includes('home.m0')&&s.totalXp>0,dn+' 습관 완료·경험치',JSON.stringify(s.pl)+' xp'+s.totalXp);
 ok(await p.locator('[data-p=hab][data-id="home.m0"]').isDisabled(),dn+' 완료한 습관은 다시 못 누름');
 // 알림 선택
 await p.locator('[data-pal=m]').check();await p.waitForTimeout(200);
 s=await p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/cq/.test(k)))));ok(s.al&&s.al['home.m']===1,dn+' 알림 선택 저장',JSON.stringify(s.al));
 await p.locator('[data-palt=m]').fill('07:45');await p.waitForTimeout(200);
 s=await p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/cq/.test(k)))));ok(s.alT&&s.alT.m==='07:45',dn+' 알림 시각 저장',JSON.stringify(s.alT));
 // 문으로 나가기 → 광장 문 앞에서 재시작
 await p.click('.pworld [data-p=out]');await p.waitForTimeout(600);
 ok(await p.locator('.world:not(.pworld)').count()===1&&await p.locator('.pworld').count()===0,dn+' 나가면 광장으로 복귀');
 await p.click('[data-w=close]');await p.waitForTimeout(300);
 ok(await p.locator('.world').count()===0,dn+' 메뉴로 나가면 오늘 화면');
 await p.click('[data-a=tab][data-t=party]');await p.waitForTimeout(200);ok((await p.locator('#app').innerText()).includes('생활 장소 습관'),dn+' 광장 탭에 장소 습관 요약');
 await p.screenshot({path:`shots6/pl_${dn}_today.png`,fullPage:false});
 await p.locator('[data-a=tab][data-t=me]:not(.link)').click();await p.waitForTimeout(300);
 ok((await p.locator('#app').innerText()).includes('장소 습관 알림'),dn+' 캐릭터 탭에 알림 설정');
 await p.locator('#app').evaluate(e=>e.scrollTo&&0);await p.locator('text=장소 습관 알림').scrollIntoViewIfNeeded();await p.screenshot({path:`shots6/pl_${dn}_alarm.png`});
 ok(errs.length===0,dn+' 오류 없음',errs.join('|'));
 await c.close()}
// 5개 장소 전부 렌더 + 지도 오류 없음
{const c=await b.newContext({...devices['iPhone 13'],timezoneId:'Asia/Seoul'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(s=>{localStorage.setItem('cq-party-v1',s)},S0({startPlaza:false}));await p.goto(F);await p.waitForTimeout(400);await p.click('[data-a=tab][data-t=party]');await p.waitForTimeout(200);
 for(const pid of ['office','home','field','school','hospital']){await p.evaluate(()=>0);await p.locator(`[data-a=plc][data-p=${pid}]`).click();await p.waitForTimeout(500);
  await p.click('[data-p=go][data-s=n]');await p.waitForTimeout(300);await p.screenshot({path:`shots6/sc_${pid}.png`});
  ok(/\+4/.test(await p.locator('#pcard').innerText()),pid+' 점심 구역 카드');await p.click('.pworld [data-p=out]');await p.waitForTimeout(400);await p.click('[data-w=close]');await p.waitForTimeout(200)}
 ok(errs.length===0,'5개 장소 오류 없음',errs.join('|'));
 // 알림 발화: 오전 알림 시각을 1분 전으로
 const c2=await b.newContext({...devices['iPhone 13'],timezoneId:'Asia/Seoul'});const q=await c2.newPage();
 await q.addInitScript(()=>{const n=new Date(),m=n.getHours()*60+n.getMinutes()-1,mm=Math.max(0,m),t=String(Math.floor(mm/60)).padStart(2,'0')+':'+String(mm%60).padStart(2,'0');
  const slot=n.getHours()<11&&n.getHours()>=5?'m':(n.getHours()>=11&&n.getHours()<16)?'n':'e';const al={};al['office.'+slot]=1;const alT={};alT[slot]=t;
  localStorage.setItem('cq-party-v1',JSON.stringify({v:2,nick:'테스터',job:'developer',look:{hair:0,hc:0,top:1,skin:0},totalXp:0,done:0,streak:0,updated:Date.now(),startPlaza:false,al,alT}))});
 await q.goto(F);await q.waitForTimeout(21500);const tx=await q.locator('.toast').allInnerTexts();ok(tx.some(x=>/습관 시간이에요/.test(x)),'알림 시각이 지나면 앱 안 알림',tx.join('|'));
 await q.waitForTimeout(21000);const st=await q.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')).alF);ok(st&&st.k.length===1,'같은 시간대 알림은 하루 한 번만',JSON.stringify(st));
}
console.log(fails?'FAILS '+fails:'ALL PASS');await b.close()})();
