const {chromium}=require('playwright');
const out='/tmp/claude-0/-home-claude/11c39566-7110-5737-8b80-1278e6e73b14/scratchpad/build/shots3/';
const f=n=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date(Date.now()-n*864e5));
(async()=>{
 const b=await chromium.launch();
 const c=await b.newContext({viewport:{width:400,height:820},deviceScaleFactor:2,colorScheme:'light'});
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
 await p.goto('file:///tmp/claude-0/-home-claude/11c39566-7110-5737-8b80-1278e6e73b14/scratchpad/build/index.html');
 await p.fill('#nk','하늘');await p.click('[data-a=next]');await p.click('[data-a=sel][data-j=teacher]');await p.click('[data-a=start]');
 await p.evaluate(()=>window.scrollTo(0,0));
 console.log('hud', await p.locator('.xpt').first().innerText());
 await p.screenshot({path:out+'01_오늘.png'});
 await p.click('[data-a=snack]');await p.click('[data-a=snack]');
 await p.locator('text=틈새 퀘스트').first().scrollIntoViewIfNeeded();
 await p.waitForTimeout(300);
 await p.screenshot({path:out+'02_틈새퀘스트.png'});
 // 휴식권: 이틀 전 마지막 + streak5, rest1
 await p.evaluate(([d2])=>{const s=JSON.parse(localStorage.getItem('cq-party-v1'));s.lastDay=d2;s.streak=5;s.rest=1;s.today=null;localStorage.setItem('cq-party-v1',JSON.stringify(s))},[f(2)]);
 await p.reload();
 await p.click('[data-a=done]');
 await p.waitForTimeout(300);
 const s1=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
 console.log('rest-case streak',s1.streak,'rest',s1.rest,'(expect 6,0)');
 // 3일 전이면 리셋
 await p.evaluate(([d3])=>{const s=JSON.parse(localStorage.getItem('cq-party-v1'));s.lastDay=d3;s.streak=9;s.rest=1;s.today=null;localStorage.setItem('cq-party-v1',JSON.stringify(s))},[f(3)]);
 await p.reload();await p.click('[data-a=done]');await p.waitForTimeout(200);
 const s2=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
 console.log('reset-case streak',s2.streak,'(expect 1)');
 // 주간 상자: count 10
 await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('cq-party-v1'));s.week.count=10;localStorage.setItem('cq-party-v1',JSON.stringify(s))});
 await p.reload();
 await p.locator('text=이번 주 모험').first().scrollIntoViewIfNeeded();
 await p.screenshot({path:out+'03_주간모험.png'});
 await p.click('[data-a=week]');await p.waitForTimeout(300);
 await p.screenshot({path:out+'04_주간상자.png'});
 await p.click('[data-a=close]');
 // 명인(Lv10)
 await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('cq-party-v1'));s.totalXp=1500;s.cnt={teacher:12};s.stats={empathy:12,leadership:7,collaboration:9};localStorage.setItem('cq-party-v1',JSON.stringify(s))});
 await p.reload();
 await p.click('[data-a=tab][data-t=me]');await p.evaluate(()=>window.scrollTo(0,0));
 await p.screenshot({path:out+'05_명인.png'});
 await p.click('[data-a=tab][data-t=me]');await p.click('.subnav [data-t=book]');await p.evaluate(()=>window.scrollTo(0,0));
 await p.screenshot({path:out+'06_도감.png'});
 console.log('errs',errs);
 await b.close();
})();
