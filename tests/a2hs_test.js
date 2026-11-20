const {chromium,devices}=require('playwright');let f=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?' '+x:''));if(!c)f++};
const U='http://localhost:8765/career-quest-party.html';
(async()=>{const b=await chromium.launch();
 for(const [n,o] of [['iPhone',devices['iPhone 13']],['Android',devices['Pixel 7']],['Desktop',{viewport:{width:1100,height:760}}]]){
  const c=await b.newContext(o);const p=await c.newPage();await p.goto(U);await p.waitForTimeout(400);
  const vis=await p.locator('#a2hs').isVisible();ok(vis===(n!=='Desktop'),n+': 홈 화면 추가 안내 '+(vis?'표시':'숨김'));
  if(vis){const t=await p.locator('#a2t').innerText();ok(n==='iPhone'?/공유 버튼/.test(t):/메뉴/.test(t),n+': 기기별 안내 문구',t.slice(0,30));
   await p.locator('#a2x').click();await p.reload();await p.waitForTimeout(300);ok(!(await p.locator('#a2hs').isVisible()),n+': 닫으면 다시 안 뜸');
   ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),n+': 가로 스크롤 없음')}
  await c.close()}
 await b.close();console.log('FAIL count:',f)})();
