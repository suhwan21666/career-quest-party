/* 앱 ↔ 서버 어댑터. 앱이 열리기 전에 이 스크립트를 넣으면 window.CQ_API.sendEvents 가 생겨요.
   설정: window.CQ_API_CFG = { url:'https://<프로젝트>.supabase.co/functions/v1/sync-events', token: async()=>'<로그인 토큰>', apikey:'<anon key>' } */
(function(){
  var C=window.CQ_API_CFG; if(!C||!C.url) return;
  window.CQ_API={ sendEvents:function(p){
    return Promise.resolve(typeof C.token==='function'?C.token():C.token).then(function(t){
      if(!t) return {ok:false,error:'no-token'};
      var h={'Content-Type':'application/json','Authorization':'Bearer '+t}; if(C.apikey) h.apikey=C.apikey;
      return fetch(C.url,{method:'POST',headers:h,body:JSON.stringify(p)}).then(function(r){
        return r.json().catch(function(){return{}}).then(function(j){
          if(r.status>=500||r.status===429||r.status===401) return {ok:false,error:'retry-later'};   // 일시 오류: 나중에 다시
          if(!r.ok) return {ok:false,error:j.error||('http-'+r.status)};                              // 영구 오류(400/409): 앱이 계속 재시도하지만 사용자에겐 영향 없음
          return {ok:true,acked:j.acked,totalXp:j.totalXp,rejected:j.rejected||[]};
        });
      });
    });
  }};
})();
