const {chromium,devices}=require('playwright');const path=require('path');let f=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?' '+x:''));if(!c)f++};
const F='file://'+path.resolve('out/career-quest-party.html');
(async()=>{const b=await chromium.launch();
for(const [dn,dev] of [['iph',devices['iPhone 13']],['desk',{viewport:{width:1000,height:800}}]]){
 const c=await b.newContext({...dev,timezoneId:'Asia/Seoul'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(F);await p.waitForTimeout(400);
 const D=()=>p.evaluate(()=>{const d=CQ_DEV.hab;return{n:Object.keys(d.LAD).length,bad:Object.keys(d.LAD).filter(j=>d.LAD[j].length!==7||d.CORE[j].length!==5||d.LAD[j].some((a,i)=>a[4]!==(i<4?'간접':'직접'))),act:0}});
 const dd=await D();ok(dd.n===8&&!dd.bad.length,dn+' 8개 직업 × 7단계(Lv1~4 간접, Lv5~7 직접) · 핵심 행동 5개',JSON.stringify(dd.bad));
 await p.fill('#nk','테스터');await p.click('[data-a=next]');
 await p.click('[data-a=explore]');await p.waitForTimeout(200);
 ok(await p.locator('.exj').count()===8&&await p.locator('.exj li').count()===40,dn+' 직업 탐색: 8개 직업, 핵심 행동 5개씩');
 ok(/광고 관찰하기/.test(await p.locator('.sheet').innerText())&&/재료 정리하기/.test(await p.locator('.sheet').innerText()),dn+' 마케터·요리사 핵심 행동 표시');
 await p.click('[data-a=exstart][data-j=marketer]');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>CQ_DEV.hab.S.hab)==='marketer:0','' +dn+' 5분 해보기 → 마케터 Lv1 습관으로 시작');
 let card=await p.locator('article.habit').innerText();ok(/광고 하나 관찰하기/.test(card)&&/간접 경험/.test(card)&&/3번 더 해보면 다음 단계/.test(card),dn+' 습관 카드: 간접 경험·단계 안내');
 await p.locator('[data-a=hab][data-m="0"]').first().click();await p.waitForTimeout(300);
 ok(await p.locator('.sheet h2').innerText()==='해보니 어땠나요?',dn+' 첫 완료 후 느낌 묻기(1번째)');
 await p.click('[data-a=fbr][data-r=fun]');await p.click('[data-a=fbkeep]');await p.click('[data-a=fbsave]');await p.waitForTimeout(200);
 let st=await p.evaluate(()=>JSON.parse(JSON.stringify(CQ_DEV.hab.S.fb)));ok(st['marketer:0']&&st['marketer:0'].fun===1&&st['marketer:0'].keep===true,dn+' 느낌 기록(재밌음·계속하고 싶음)',JSON.stringify(st));
 // 3번째: 다음 단계 열림
 await p.evaluate(()=>{const D=CQ_DEV.hab,S=D.S;S.habs['marketer:0'].total=2;S.today.qs.find(q=>q.k==='habit').done=0;D.save()});await p.waitForTimeout(200);
 await p.locator('[data-a=hab][data-m="0"]').first().click();await p.waitForTimeout(300);
 const o=await p.evaluate(()=>({o1:CQ_DEV.hab.hOpen('marketer:1'),o2:CQ_DEV.hab.hOpen('marketer:2'),s:(CQ_DEV.hab.hSuggest()||{}).id}));
 ok(o.o1&&!o.o2&&o.s==='marketer:1',dn+' 3번 하면 Lv2 열림·제안(7번 안 기다림)',JSON.stringify(o));
 await p.click('[data-a=close]');await p.waitForTimeout(200);
 // 직접 경험 Lv5: 한 줄 필수
 await p.evaluate(()=>{const D=CQ_DEV.hab,S=D.S;S.habs['marketer:3']={streak:3,best:3,total:3,last:D.KST(),days:[]};S.hab='marketer:4';S.today.qs.find(q=>q.k==='habit').done=0;D.save()});await p.waitForTimeout(200);
 card=await p.locator('article.habit').innerText();ok(/직접 경험/.test(card)&&/한 줄을 남겨요/.test(card),dn+' Lv5 카드: 직접 경험 표시');
 await p.locator('[data-a=hab][data-m="0"]').first().click();await p.waitForTimeout(300);
 ok(await p.locator('.sheet h2').innerText()==='직접 해본 걸 남겨요',dn+' 직접 경험은 기록 창이 먼저 열림');
 await p.click('[data-a=proofgo]');await p.waitForTimeout(200);
 ok(/한 줄 이상/.test(await p.locator('.sheet').innerText())&&!await p.evaluate(()=>CQ_DEV.hab.S.today.qs.find(q=>q.k==='habit').done),dn+' 한 줄이 없으면 완료되지 않음');
 await p.fill('#fbnote','카페 신메뉴 SNS 글 올림');await p.click('[data-a=fbr][data-r=ok]');
 ok(await p.inputValue('#fbnote')==='카페 신메뉴 SNS 글 올림',dn+' 반응 선택해도 쓴 글 유지');
 await p.click('[data-a=proofgo]');await p.waitForTimeout(400);
 st=await p.evaluate(()=>({n:CQ_DEV.hab.S.habs['marketer:4'].notes,d:CQ_DEV.hab.S.today.qs.find(q=>q.k==='habit').done,x:CQ_DEV.hab.hTot('marketer:4')}));
 ok(st.d&&st.x===1&&st.n&&st.n[0].t.includes('SNS'),dn+' 직접 경험 기록(한 줄) 저장·완료',JSON.stringify(st));
 // 내 기록
 await p.click('[data-a=tab][data-t=me]');await p.waitForTimeout(300);
 const g=await p.locator('.grow').innerText();ok(/마케터/.test(g)&&/간접 \d/.test(g)&&/직접 1/.test(g)&&/SNS/.test(g),dn+' 나의 직업 경험 기록: 간접/직접·한 줄',g.replace(/\n/g,' ').slice(0,100));
 ok(/가장 잘 맞는 느낌/.test(await p.locator('#app').innerText()),dn+' 잘 맞는 직업 힌트');
 await p.locator('.grow').scrollIntoViewIfNeeded();await p.screenshot({path:`shots6/lad_${dn}_grow.png`});
 // 도감 직업 모달에 핵심 행동
 await p.click('.subnav [data-t=book]');await p.waitForTimeout(250);await p.locator('.jc[data-j=chef]').click();await p.waitForTimeout(200);
 ok(/이 직업의 핵심 행동/.test(await p.locator('.sheet').innerText())&&/레시피대로 정확하게 실행하기/.test(await p.locator('.sheet').innerText()),dn+' 도감: 핵심 행동 표시');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),dn+' 가로 넘침 없음');ok(!errs.length,dn+' 오류 없음',errs.join('|'));
 await c.close();
 // 이전 저장 이전(migration)
 const c2=await b.newContext({...dev});const p2=await c2.newPage();
 await p2.addInitScript(()=>{localStorage.setItem('cq-party-v1',JSON.stringify({v:2,nick:'예전',job:'developer',hab:'developer:2',habs:{'developer:2':{streak:2,best:2,total:5,last:'2026-11-01',days:[]},'nurse:0':{streak:1,best:1,total:1,last:'2026-11-01',days:[]},'chef:1':{streak:1,best:1,total:1,last:'2026-11-01',days:[]}},look:{hair:1,hc:1,top:2,skin:1},totalXp:50}))});
 await p2.goto(F);await p2.waitForTimeout(500);
 const m=await p2.evaluate(()=>({h:CQ_DEV.hab.S.hab,k:Object.keys(CQ_DEV.hab.S.habs),v:CQ_DEV.hab.S.hver}));
 ok(m.h===null&&m.k.length===0&&m.v===2,dn+' 예전 습관 기록 정리(직업·XP 유지)',JSON.stringify(m));
 ok(/오늘의 퀘스트/.test(await p2.locator('#app').innerText()),dn+' 예전 사용자 정상 시작');await c2.close()}
await b.close();console.log(f?'FAILS '+f:'ALL PASS');process.exit(f?1:0)})();
