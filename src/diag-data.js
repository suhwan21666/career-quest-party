/* 성향 진단·자기평가 문항 — 역량 8개와 1:1. 정식 심리검사가 아니라 "관심 기반 추천 + 변화 측정용 자기평가"예요.
   DIAG_ACT  : 끌리는 활동(최대 3개) → 추천 직업 계산에 사용 (직업의 dna 역량과 겹칠수록 점수)
   DIAG_SELF : 지난 2주 나의 모습(1~5점) → 시작 때(pre)와 14일 뒤(chk)를 비교해 변화 측정 */
const DIAG_ACT=[
 ['creativity','새로운 아이디어를 떠올리고 만들어보기'],
 ['problemSolving','막힌 문제의 원인을 찾아 해결하기'],
 ['collaboration','사람들과 함께 일하며 결과 만들기'],
 ['leadership','계획을 세우고 앞장서서 이끌기'],
 ['empathy','다른 사람의 이야기를 듣고 도와주기'],
 ['analytical','숫자와 자료를 비교하고 정리하기'],
 ['execution','정해진 일을 꼼꼼하게 끝까지 해내기'],
 ['challenge','처음 해보는 일에 도전하기']];
const DIAG_SELF=[
 ['creativity','새로운 아이디어를 내서 적어본다'],
 ['problemSolving','문제가 생기면 원인을 찾아 해결해본다'],
 ['collaboration','다른 사람의 의견을 듣고 함께 일한다'],
 ['leadership','할 일의 순서를 정해 앞장서서 이끈다'],
 ['empathy','상대방의 입장에서 생각해본다'],
 ['analytical','자료나 숫자를 근거로 판단한다'],
 ['execution','시작한 일을 끝까지 마무리한다'],
 ['challenge','해본 적 없는 일에 도전한다']];
const dayDiff=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
function diagRec(picks){return jobsShown().filter(j=>(CORE[j.id]||[]).length).map((j,i)=>{const m=(j.dna||[]).filter(s=>picks.includes(s));return{j,i,m,score:m.length}}).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,3)}
function addAssess(r){const k=S.assess.some(x=>x.k==='pre')?'chk':'pre';S.assess.push({d:KST(),k,r:{...r}});S.assess=S.assess.slice(-12);return k}
function assessDue(){if(!S.job)return false;const l=S.assess[S.assess.length-1];return !!(l&&S.assess.some(x=>x.k==='pre')&&dayDiff(l.d,KST())>=14)}
const avgR=a=>{const v=DIAG_SELF.map(x=>a.r[x[0]]).filter(x=>x>0);return v.length?v.reduce((s,x)=>s+x,0)/v.length:0};
/* 효과 측정 지표(사용자 기기에서 계산). 정의는 docs/EFFECT_MEASUREMENT.md */
function metrics(){const d=KST(),A=(S.actd||[]).slice().sort(),pre=S.assess.find(x=>x.k==='pre'),chk=S.assess.filter(x=>x.k==='chk').pop();
 let jobs=0,dir=0,ind=0,fun=0,ok=0,no=0,keep=0;const jset={};
 Object.keys(S.habs||{}).forEach(id=>{const n=(S.habs[id]||{}).total||0;if(!n)return;const hi=habInfo(id);if(!hi)return;jset[hi.j]=1;(hi.kind==='직접'?dir+=n:ind+=n);const f=S.fb&&S.fb[id];if(f){fun+=f.fun||0;ok+=f.ok||0;no+=f.no||0;if(f.keep)keep++}});
 jobs=Object.keys(jset).length;
 const span=A.length?dayDiff(A[0],A[A.length-1]):0;
 return{days:A.length,since:S.born||A[0]||d,span,ret7:A.length>=3&&span>=6,streak:S.streak|0,jobs,ind,dir,prf:(S.prf||[]).length,ach:Object.keys(S.hdone||{}).length,fun,ok,no,keep,pre:pre?avgR(pre):0,chk:chk?avgR(chk):0,delta:(pre&&chk)?avgR(chk)-avgR(pre):null}}
