const {chromium,devices}=require('playwright');
let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?'  '+x:''));if(!c)fails++};
const URL='http://localhost:8765/career-quest-party.html';
(async()=>{const b=await chromium.launch();
 for(const dn of ['iPhone 13','Pixel 7']){
  const ctx=await b.newContext({...devices[dn],timezoneId:'Asia/Seoul',acceptDownloads:true});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.waitForTimeout(500);
  ok(await p.locator('#app').innerText().then(t=>/직업|이름|모험/.test(t)),dn+': 시작 화면 표시 (claude 런타임 없이)');
  // 설정 → 시작
  await p.fill('#nk','모바일');await p.locator('[data-a=next]').click();await p.waitForTimeout(150);
  await p.locator('[data-a=sel]').first().click();await p.locator('[data-a=start]').click();await p.waitForTimeout(400);
  ok(await p.locator('text=오늘의 퀘스트').first().isVisible(),dn+': 게임 시작');
  // 퀘스트 1개 완료(첫 카드)
  await p.locator('[data-a=done]').first().click().catch(()=>{});await p.waitForTimeout(300);
  const xp1=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')).totalXp);ok(xp1>0,dn+': 퀘스트 완료로 XP 증가',String(xp1));
  await p.reload();await p.waitForTimeout(500);
  const xp2=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')).totalXp);ok(xp2===xp1,dn+': 새로고침 후 기록 유지');
  // 광장
  await p.locator('[data-a=world]').click();await p.waitForTimeout(700);
  ok(/NPC/.test(await p.locator('#wcnt').innerText()),dn+': 광장에서 NPC와 산책');
  await p.keyboard.press('Escape');await p.waitForTimeout(200);
  // 파티 탭 문구
  await p.locator('[data-a=tab][data-t=party]:not(.link)').click();await p.waitForTimeout(200);
  const pt=await p.locator('#app').innerText();ok(!/로그인|Contributor/.test(pt),dn+': 파티 탭에 로그인 안내 문구 없음');
  // 캐릭터 탭: 알림 파일 다운로드
  await p.locator('[data-a=tab][data-t=me]:not(.link)').click();await p.waitForTimeout(200);
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:5000}).catch(()=>null),p.locator('[data-a=ics]').click()]);
  ok(!!dl&&dl.suggestedFilename()==='career-quest-reminder.ics',dn+': 알림(.ics) 파일 다운로드',dl&&dl.suggestedFilename());
  const meText=await p.locator('#app').innerText();ok(/이 기기의 브라우저에만 저장/.test(meText),dn+': 저장 위치 안내 문구');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),dn+': 가로 스크롤 없음');
  ok(errs.length===0,dn+': JS 오류 없음',errs.join('|'));
  await p.screenshot({path:`shots5/standalone_${dn.replace(' ','')}.png`});
  await ctx.close()}
 await b.close();console.log('FAIL count:',fails)})();
