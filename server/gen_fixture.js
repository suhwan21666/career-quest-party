// 실제 앱을 돌려서 이벤트 기록(fixture.json)을 만들어요. 사용: NODE_PATH=$(npm root -g) node gen_fixture.js <앱.html>
const {chromium,devices}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],timezoneId:'Asia/Seoul'});const p=await c.newPage();
await p.addInitScript(()=>{window.__cqNoPlaza=1;window.__cqNoFb=1;window.__cqFeatAll=1});
await p.goto('file://'+path.resolve(process.argv[2]));await p.waitForTimeout(400);
await p.fill('#nk','픽스처');await p.click('[data-a=next]');await p.click('[data-a=sel][data-j=developer]');await p.click('[data-a=start]');await p.waitForTimeout(800);
await p.evaluate(()=>{const D=CQ_DEV.hab,d=D.KST();D.S.hab='developer:0';D.S.habs['developer:0']={streak:2,best:2,total:2,last:D.prevDay(d),days:[]};D.S.streak=4;D.save()});await p.reload();await p.waitForTimeout(700);
const hb=p.locator('[data-a=hab][data-m="0"]').first();if(await hb.count()){await hb.click();await p.waitForTimeout(600);if(await p.locator('.sheet [data-a=close]').count())await p.click('.sheet [data-a=close]').catch(()=>{});}
for(let n=0;n<8;n++){const q=p.locator('[data-a=done]').first();if(!await q.count())break;await q.click();await p.waitForTimeout(500);
 const sub=p.locator('.sheet [data-a=submit],.sheet [data-a=save]').first();if(await sub.count()){const ta=p.locator('.sheet textarea,.sheet input[type=text]').first();if(await ta.count())await ta.fill('오늘 해본 한 줄');await sub.click().catch(()=>{});await p.waitForTimeout(400)}
 if(await p.locator('.sheet [data-a=close]').count())await p.click('.sheet [data-a=close]').catch(()=>{});await p.waitForTimeout(200)}
const s=await p.evaluate(()=>{const D=CQ_DEV.hab;const e=D.evState();return{evBase:e.evBase,ev:e.ev,totalXp:e.totalXp}});
fs.writeFileSync(path.join(__dirname,'fixture.json'),JSON.stringify(s,null,1));console.log('events',s.ev.length,'xp',s.totalXp,s.ev.map(e=>e.k).join(','));await b.close()})()
