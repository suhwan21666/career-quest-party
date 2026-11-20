const {chromium,devices}=require('playwright');const path=require('path');
const F='file://'+path.resolve(process.argv[2]||'index.html');
let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?'  '+x:''));if(!c)fails++};
(async()=>{const b=await chromium.launch();
 for(const [name,dev] of [['phone',devices['iPhone 13']],['desktop',{viewport:{width:1100,height:760}}]]){
  const ctx=await b.newContext({...dev,timezoneId:'Asia/Seoul'});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{
    window.__pwn=null;window.__pres=[];window.__handlers=[];
    const mk=(o)=>({peer:'p'+Math.random().toString(36).slice(2,8),by:null,isMe:false,sameTab:false,kind:'viewer',guest:false,updatedAt:Date.now(),presence:{},...o});
    const peers=[
      mk({peer:'good',by:'u_good',presence:{w:1,x:430,y:700,f:1,n:'하늘',j:'nurse',l:5,k:[1,2,3,0],s:0,i:0}}),
      mk({peer:'xss',by:'u_x',presence:{w:1,x:380,y:720,n:'<img src=x onerror=window.__pwn=1>',j:'__proto__',l:'9e99',k:'zz',s:0}}),
      mk({peer:'blk',by:'u_blocked',presence:{w:1,x:300,y:700,n:'차단됨',j:'chef',l:2,k:[0,0,1,0]}}),
      mk({peer:'nan',by:'u_n',presence:{w:1,x:'NaN',y:null,n:'엉뚱',j:'chef',l:2,k:[0,0,1,0]}}),
      mk({peer:'bad',by:'u_bad',presence:{w:1,x:350,y:760,n:'시발',j:'chef',l:3,k:[0,0,1,0]}}),
      mk({peer:'away',by:'u_away',presence:{x:300,y:600,n:'다른탭',j:'chef'}}),   // w 없음 → 제외
      mk({peer:'me2',by:'u_me',isMe:true,presence:{w:1,x:400,y:640,n:'나'}}),
      mk({peer:'agent',kind:'agent',presence:{w:1,x:1,y:1}})];
    const room={presence:(x)=>{window.__pres.push(x);return Promise.resolve()},peers:()=>peers,onPeers:(h)=>{window.__handlers.push(h);setTimeout(()=>h({peers}),50);return()=>{}}};
    window.claude={use:async(n)=>n==='room'?room:null};
    localStorage.setItem('cq-party-v1',JSON.stringify({v:2,nick:'테스터',job:'developer',look:{hair:0,hc:0,top:1,skin:0},totalXp:0,blocked:{u_blocked:1}}));
  });
  await p.goto(F);await p.waitForTimeout(500);
  await p.click('[data-a=tab][data-t=party]');await p.waitForTimeout(200);
  ok(await p.locator('text=광화문 광장').first().isVisible(),name+': 광장 탭에 광장 입장 카드');
  await p.locator('[data-a=world]').click();await p.waitForTimeout(700);
  ok(await p.locator('.world').count()===1,name+': 월드 열림');
  const cnt=await p.locator('#wcnt').innerText();ok(/지금 5명/.test(cnt),name+': 접속자 수: 차단·미입장·에이전트·내 다른탭 제외, 정리된 3명은 포함',cnt);
  // 이동: 위쪽 방향키 → 광화문 앞 도착
  await p.keyboard.down('ArrowUp');await p.waitForTimeout(1700);await p.keyboard.up('ArrowUp');await p.waitForTimeout(200);
  ok(await p.locator('#wcard').isVisible()&&/광화문/.test(await p.locator('#wcard').innerText()),name+': 광화문 앞에서 안내 카드');
  await p.screenshot({path:`shots5/${name}_gate.png`});
  await p.locator('[data-w=stamp]').click();await p.waitForTimeout(300);
  ok(await p.locator('[data-w=stamp]').isDisabled(),name+': 스탬프 후 버튼 비활성');
  const toast=await p.locator('.toast').first().innerText().catch(()=>'');ok(/\+3 XP/.test(toast),name+': 스탬프 XP 토스트',toast);
  // 막힌 곳(동상 받침대)을 통과하지 못하는지: 아래쪽으로 쭉 걸어 세종대왕상 근처까지
  await p.keyboard.down('ArrowDown');await p.waitForTimeout(2200);await p.keyboard.up('ArrowDown');await p.waitForTimeout(200);
  await p.screenshot({path:`shots5/${name}_walk.png`});
  // 인사
  await p.locator('[data-w=say]').nth(1).click();await p.waitForTimeout(150);
  const last=await p.evaluate(()=>window.__pres.filter(x=>x.s>=1).pop());ok(last&&last.s===1&&last.i===1&&last.w===1,name+': 인사 말풍선 presence 전송',JSON.stringify(last||{}).slice(0,80));
  // 탭 이동(포인터): 화면 중앙 아래를 누름
  const box=await p.locator('#wc').boundingBox();await p.mouse.click(box.x+box.width/2,box.y+box.height*0.8);await p.waitForTimeout(900);
  await p.screenshot({path:`shots5/${name}_tap.png`});
  ok(await p.evaluate(()=>window.__pwn)===null,name+': XSS 닉네임 실행 안 됨');
  await p.keyboard.press('Escape');await p.waitForTimeout(300);
  ok(await p.locator('.world').count()===0,name+': Esc로 닫힘');
  const clr=await p.evaluate(()=>window.__pres.pop());ok(clr&&clr.w===null,name+': 나갈 때 presence 정리');
  ok(await p.locator('text=스탬프 1 / 7').count()>0,name+': 스탬프 도감 반영');
  ok(errs.length===0,name+': JS 오류 없음',errs.join('|'));
  await ctx.close()}
 // claude 없음(혼자)에서도 동작
 const c2=await b.newContext({...devices['iPhone 13']});const p2=await c2.newPage();const e2=[];p2.on('pageerror',e=>e2.push(e.message));
 await p2.addInitScript(()=>{localStorage.setItem('cq-party-v1',JSON.stringify({v:2,nick:'혼자',job:'chef',look:{hair:1,hc:1,top:2,skin:1},totalXp:50}))});
 await p2.goto(F);await p2.waitForTimeout(300);await p2.click('[data-a=tab][data-t=party]');await p2.waitForTimeout(200);await p2.locator('[data-a=world]').click();await p2.waitForTimeout(800);
 ok(/NPC/.test(await p2.locator('#wcnt').innerText()),'공유 연결 없이도 NPC와 산책');await p2.waitForTimeout(2500);await p2.screenshot({path:'shots5/solo.png'});
 ok(e2.length===0,'혼자 모드 JS 오류 없음',e2.join('|'));
 await b.close();console.log('FAIL count:',fails)})();
