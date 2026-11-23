const {chromium,devices}=require('playwright');const path=require('path');let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?'  '+x:''));if(!c)fails++};
const F='file://'+path.resolve('out/career-quest-party.html');
(async()=>{const b=await chromium.launch();
for(const [dn,dev] of [['iph',devices['iPhone 13']],['desk',{viewport:{width:1000,height:800}}]]){
 const c=await b.newContext({...dev,timezoneId:'Asia/Seoul'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__cqNoPlaza=1});
 await p.goto(F);await p.waitForTimeout(400);
 await p.fill('#nk','테스터');await p.click('[data-a=next]');await p.click('[data-a=sel][data-j=developer]');await p.click('[data-a=start]');await p.waitForTimeout(700);
 const lens=await p.evaluate(()=>(D=>Object.keys(D.HABITS).map(j=>D.HABITS[j].length))(CQ_DEV.hab));ok(lens.length===16&&lens.every(n=>n>=6),dn+' 16개 직업 모두 Lv6 이상',lens.join(','));
 await p.click('[data-a=habopen]');await p.waitForTimeout(200);
 let t=await p.locator('.sheet').innerText();
 ok(/Lv1 간접/.test(t)&&/Lv7 직접/.test(t)&&/Lv1을 3번 해보면 열려요/.test(t),dn+' 모달: 레벨 표시·잠금',t.replace(/\n/g,' ').slice(0,90));
 ok(await p.locator('.hopt[disabled]').count()===6,dn+' 처음엔 Lv2~7 잠김');
 await p.click('[data-a=habpick][data-h="developer:0"]');await p.waitForTimeout(200);
 // 6회 해낸 상태로 만들고 오늘 한 번 더
 await p.evaluate(()=>{const D=CQ_DEV.hab,d=D.KST();D.S.habs['developer:0']={streak:6,best:6,total:6,last:D.prevDay(d),days:[]};D.save()});
 await p.waitForTimeout(200);
 await p.locator('[data-a=hab][data-m="0"]').first().click();await p.waitForTimeout(500);if(await p.locator('.sheet [data-a=close]').count())await p.click('.sheet [data-a=close]');await p.waitForTimeout(200);
 const s=await p.evaluate(()=>(D=>({d:D.S.hdone,o1:D.hOpen('developer:1'),o2:D.hOpen('developer:2'),sg:(D.hSuggest()||{}).id}))(CQ_DEV.hab));
 ok(s.d['developer:0']&&s.o1&&!s.o2&&s.sg==='developer:1',dn+' 7회째 달성→Lv2 해금·제안',JSON.stringify(s));
 const card=await p.locator('article.habit').innerText();ok(/새 습관 제안/.test(card)&&/Lv1 쉬움/.test(card),dn+' 오늘 카드에 새 습관 제안');
 await p.screenshot({path:`shots6/hab_${dn}_today.png`});
 await p.click('article.habit [data-a=habpick]');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>CQ_DEV.hab.S.hab)==='developer:1',dn+' 제안 수락하면 Lv2로 변경');
 // 캐릭터 탭 기록
 await p.click('[data-a=tab][data-t=me]');await p.waitForTimeout(300);
 const rec=await p.locator('.lad').innerText();ok(/달성 ✓/.test(rec)&&/하는 중/.test(rec)&&/🔒/.test(rec),dn+' 내 습관 기록(달성·진행·잠김)',rec.replace(/\n/g,' ').slice(0,110));
 await p.screenshot({path:`shots6/hab_${dn}_me.png`,fullPage:false});
 await p.locator('.lad').scrollIntoViewIfNeeded();await p.screenshot({path:`shots6/hab_${dn}_rec.png`});
 // 기존 저장 호환: 예전 습관 developer:2 를 이미 한 사람은 잠겨있어도 쓸 수 있다
 const lg=await p.evaluate(()=>{const D=CQ_DEV.hab;D.S.habs['developer:4']={streak:1,best:1,total:2,last:D.KST(),days:[]};return D.hOpen('developer:4')});ok(lg===true,dn+' 기존 기록이 있는 습관은 계속 사용 가능');
 // 세로 넘침 없음
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),dn+' 가로 넘침 없음');
 ok(errs.length===0,dn+' 스크립트 오류 없음',errs.join('|'));
 await c.close()}
await b.close();console.log(fails?'FAILS '+fails:'ALL PASS');process.exit(fails?1:0)})();
