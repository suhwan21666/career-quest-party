/* 로그인 없는(익명) 온라인 모드: claude.ai 런타임 대신 Supabase로 db / user / room 을 흉내 낸다.
   CQ_CONFIG 가 비어 있으면 아무것도 하지 않고, 게임은 혼자 하는 모드로 동작한다. */
(function(){
  var C=window.CQ_CONFIG;window.CQ_ONLINE=!!(C&&C.url&&C.key);
  if(!window.CQ_ONLINE)return;
  var ready=null,ctx=null,adminPass=null,adminOk=false;
  function boot(){
    if(ready)return ready;
    ready=new Promise(function(res){
      var done=false;function fin(v){if(!done){done=true;res(v)}}
      setTimeout(function(){fin(null)},12000);
      var s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js';
      s.onerror=function(){fin(null)};
      s.onload=function(){try{
        var sb=window.supabase.createClient(C.url,C.key,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'cq-sb-auth'},realtime:{params:{eventsPerSecond:10}}});
        sb.auth.getSession().then(function(r){
          if(r&&r.data&&r.data.session)return r.data.session;
          return sb.auth.signInAnonymously().then(function(x){return x&&x.data&&x.data.session});
        }).then(function(ses){
          if(!ses||!ses.user){fin(null);return}
          ctx={sb:sb,uid:ses.user.id};
          /* 관리자: 주소 끝의 #admin=비밀번호 로 한 번 들어오면 이 탭에서만 기억한다 */
          try{var m=/[#&]admin=([^&]+)/.exec(location.hash);if(m){adminPass=decodeURIComponent(m[1]);sessionStorage.setItem('cq-admin',adminPass);history.replaceState(null,'',location.pathname+location.search)}else adminPass=sessionStorage.getItem('cq-admin')}catch(e){}
          if(!adminPass){fin(ctx);return}
          sb.rpc('admin_list',{p_pass:adminPass,p_coll:'testers'}).then(function(r){
            adminOk=!(r&&r.error);if(!adminOk){try{sessionStorage.removeItem('cq-admin')}catch(e){}adminPass=null}fin(ctx)
          },function(){adminPass=null;fin(ctx)});
        }).catch(function(){fin(null)});
      }catch(e){fin(null)}};
      document.head.appendChild(s);
    });
    return ready;
  }
  function mkDb(c){
    var sb=c.sb;
    function docRef(path){return{
      get:async function(){var r=await sb.from('kv').select('data').eq('path',path).maybeSingle();if(r.error)throw r.error;var d=r.data;return{exists:!!d,data:function(){return d?d.data:undefined}}},
      set:async function(d){var r=await sb.from('kv').upsert({path:path,data:d},{onConflict:'path'});if(r.error)throw r.error},
      update:async function(p){var g=await sb.from('kv').select('data').eq('path',path).maybeSingle();var cur=(g.data&&g.data.data)||{};var r=await sb.from('kv').upsert({path:path,data:Object.assign({},cur,p)},{onConflict:'path'});if(r.error)throw r.error},
      delete:async function(){var r=await sb.from('kv').delete().eq('path',path);if(r.error)throw r.error}}}
    function coll(name){
      var fl=[];
      async function fetchAll(){
        var rows;
        if(adminOk&&adminPass&&(name==='testers'||name==='reports')){
          var a=await sb.rpc('admin_list',{p_pass:adminPass,p_coll:name});if(a.error)throw a.error;rows=a.data||[];
          fl.forEach(function(f){rows=rows.filter(function(x){return x.data&&String(x.data[f[0]])===f[1]})});
        }else{
          var q=sb.from('kv').select('path,data').eq('coll',name);
          fl.forEach(function(f){q=q.filter('data->>'+f[0],'eq',f[1])});
          var r=await q.limit(200);if(r.error)throw r.error;rows=r.data||[];
        }
        return{docs:rows.map(function(x){return{id:x.path.split('/').slice(1).join('/'),data:function(){return x.data}}})}
      }
      var q={where:function(f,op,v){if(op!=='=='&&op!=='eq')throw new Error('unsupported');fl.push([f,String(v)]);return q},
        get:fetchAll,
        onSnapshot:function(cb,err){
          var last='',stopped=false;
          var tick=async function(){if(stopped)return;try{var s=await fetchAll();var j=JSON.stringify(s.docs.map(function(d){return[d.id,d.data()]}));if(j!==last){last=j;cb(s)}}catch(e){if(err)err(e)}};
          tick();var h=setInterval(function(){if(!document.hidden)tick()},3000);
          return function(){stopped=true;clearInterval(h)}}};
      return q}
    return{doc:docRef,collection:coll}
  }
  var roomP=null;
  function mkRoom(c){
    if(roomP)return roomP;
    var sb=c.sb,uid=c.uid,mine={},handlers=[],tt=0,subscribed=false;
    var ch=sb.channel('plaza',{config:{presence:{key:uid},broadcast:{self:false}}});
    function list(){var st=ch.presenceState(),out=[];Object.keys(st).forEach(function(k){if(k===uid)return;var m=st[k]&&st[k][st[k].length-1];if(!m)return;var p={};Object.keys(m).forEach(function(x){if(x!=='presence_ref')p[x]=m[x]});out.push({peer:k,by:k,isMe:false,sameTab:false,kind:'viewer',guest:false,updatedAt:Date.now(),presence:p})});return out}
    function fire(){var l=list();handlers.slice().forEach(function(h){try{h({peers:l})}catch(e){}})}
    function track(){if(!subscribed)return;try{ch.track(Object.assign({},mine))}catch(e){}}
    function schedule(){if(tt)return;tt=setTimeout(function(){tt=0;track()},250)}
    ch.on('presence',{event:'sync'},fire);
    ch.subscribe(function(status){if(status==='SUBSCRIBED'){subscribed=true;track()}});
    roomP={
      presence:async function(p){Object.keys(p||{}).forEach(function(k){if(p[k]===null)delete mine[k];else mine[k]=p[k]});schedule()},
      peers:list,
      onPeers:function(cb){handlers.push(cb);return function(){var i=handlers.indexOf(cb);if(i>=0)handlers.splice(i,1)}}};
    return roomP}
  window.claude={use:async function(name){
    var c=await boot();if(!c)return null;
    if(name==='db')return mkDb(c);
    if(name==='user')return{id:async function(){return c.uid},can:async function(){return true},canEdit:function(){return adminOk},isOwner:function(){return adminOk}};
    if(name==='room')return mkRoom(c);
    return null}};
})();
