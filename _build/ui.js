/* ═══ 화면 ═══ */
const $=s=>document.querySelector(s), APP=()=>document.getElementById('app');
const esc=s=>String(s==null?'':s).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
const KEY='hsc_v31';
const GATE_HASH='32ea6aa8091a36e8779df25bed19f857a402b1f3862c8c07212928f0f2ea886d';   // SHA-256(검사 비밀번호). 평문은 소스에 두지 않는다.
async function sha256(t){
  try{
    if(typeof crypto!=='undefined'&&crypto.subtle){
      const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));
      return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
    }
  }catch(e){}
  return sha256js(t);   // file:// 등 subtle이 없는 환경
}
function sha256js(ascii){
  function rr(n,x){return (x>>>n)|(x<<(32-n));}
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const bytes=[]; for(let i=0;i<ascii.length;i++){let c=ascii.charCodeAt(i);
    if(c<128)bytes.push(c); else if(c<2048){bytes.push(192|(c>>6),128|(c&63));}
    else{bytes.push(224|(c>>12),128|((c>>6)&63),128|(c&63));}}
  const l=bytes.length*8; bytes.push(0x80); while(bytes.length%64!==56)bytes.push(0);
  for(let i=7;i>=0;i--)bytes.push((l/Math.pow(2,i*8))&255);
  for(let j=0;j<bytes.length;j+=64){
    const w=new Array(64);
    for(let i=0;i<16;i++)w[i]=(bytes[j+i*4]<<24)|(bytes[j+i*4+1]<<16)|(bytes[j+i*4+2]<<8)|bytes[j+i*4+3];
    for(let i=16;i<64;i++){const s0=rr(7,w[i-15])^rr(18,w[i-15])^(w[i-15]>>>3);
      const s1=rr(17,w[i-2])^rr(19,w[i-2])^(w[i-2]>>>10);
      w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
    let [a,b,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){const S1=rr(6,e)^rr(11,e)^rr(25,e);const ch=(e&f)^(~e&g);
      const t1=(h+S1+ch+K[i]+w[i])|0;const S0=rr(2,a)^rr(13,a)^rr(22,a);
      const mj=(a&b)^(a&c)^(b&c);const t2=(S0+mj)|0;
      h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
    H=[(H[0]+a)|0,(H[1]+b)|0,(H[2]+c)|0,(H[3]+d)|0,(H[4]+e)|0,(H[5]+f)|0,(H[6]+g)|0,(H[7]+h)|0];}
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('');
}
let S={a:{},i:0,phase:'gate',t0:0,ms:0};
try{const r=localStorage.getItem(KEY); if(r) S=Object.assign(S,JSON.parse(r));}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const MO=['A1','A2','A3','A4','A5','A6','B1','B2','B3','B4','B5','C1','C2','D1','D2','D3',
          'E1','E2','F1','F2','G1','G2','G3','H1','I1','I2'];
const KID=['K1','K2','K3','K4'].concat(QUESTIONS.tracks.map(t=>'K5-'+t.id));
const TB=['TB1','TB2'];
const BLOCKNAME={A:'기본 정보',B:'현재 성적',C:'시험',D:'공부 습관',E:'공부 환경',
  F:'공부 리듬',G:'공부 계획',H:'추가 확인',I:'적어 주실 것',K:'아이 문항',TB:'마지막 확인'};
const GRADE=()=>QUESTIONS.grades.find(g=>g.id===S.a.A1)||{has:[]};
function visible(id){
  const q=QI[id]; if(!q) return false;
  // 문항이 깔고 있는 전제를 그 학년이 못 채우면 띄우지 않는다
  if(q.requires&&q.requires.length){
    const has=GRADE().has||[];
    if(!q.requires.every(r=>has.includes(r))) return false;}
  const si=q.showIf;
  if(si){ if(si.grade&&!si.grade.includes(S.a.A1)) return false;
    for(const k in si){ if(k==='grade')continue;
      const w=si[k],g=S.a[k];
      if(Array.isArray(w)){ if(!(Array.isArray(g)?g.some(x=>w.includes(x)):w.includes(g))) return false; }
      else if(g!==w) return false; } }
  if(q.block==='TB'){ const r=S.res; if(!r) return false;
    if(id==='TB1') return r.needTB1; if(id==='TB2') return r.needTB2; }
  return true;
}
const queue=()=>(S.phase==='kid'?KID:S.phase==='tb'?TB:MO).filter(visible);
function answered(id){const q=QI[id],v=S.a[id];
  if(q.optional) return true;
  if(q.scale==='multi') return Array.isArray(v)&&v.length>0;
  if(q.scale==='number-grid') return v&&Object.keys(v).length===5&&Object.values(v).every(r=>r.raw!==''&&r.mean!=='');
  if(q.scale==='region') return v&&v.sido;
  return v!==undefined&&v!==null&&v!=='';}
const NEEDBTN=q=>['multi','number-grid','region','text'].includes(q.scale)||(q.id==='B5'&&S.a.B5==='A');
function advance(){
  const qq=queue();
  if(S.i<qq.length-1){S.i++;save();render();return;}
  if(S.phase==='mo'){S.phase='handoff';S.i=0;save();render();return;}
  if(S.phase==='kid'){
    S.ms=Date.now()-(S.t0||Date.now());
    const f=sincerity(S.a,S.ms);
    S.res=evaluate(S.a);
    if(f.length>=RULES.sincerity.flagAt&&!S.checked){S.flags=f;S.phase='check';save();render();return;}
    if(TB.filter(visible).length){S.phase='tb';S.i=0;save();render();return;}
    S.phase='result';save();render();return;}
  if(S.phase==='tb'){S.res=evaluate(S.a);S.phase='result';save();render();return;}
}
function back(){ if(S.i>0){S.i--;save();render();} }
function barHTML(){
  const qq=queue(),n=qq.length,i=S.i+1,kid=S.phase==='kid',q=QI[qq[S.i]];
  const nm=kid?'아이가 답합니다':(BLOCKNAME[q?q.block:'A']||'');
  // 블록 B는 성적표 유무로 문항 수가 갈려 도중에 총계가 바뀐다. 분수를 안 붙인다.
  const branching=q&&q.block==='B';
  const idx=q?qq.filter(x=>QI[x].block===q.block).indexOf(q.id)+1:1;
  const tot=q?qq.filter(x=>QI[x].block===q.block).length:1;
  const frac=branching?'':` ${idx}/${tot}`;
  return `<div class="bar"><div class="bar-row"><span class="bar-ax${kid?' kid':''}">${esc(nm)}${frac}</span>
    <span class="bar-n tnum">${i} / ${n}</span></div>
    <div class="bar-t"><div class="bar-f${kid?' kid':''}" style="flex:${i}"></div><div class="bar-r" style="flex:${Math.max(n-i,0)}"></div></div></div>`;
}
function qHTML(q){
  const v=S.a[q.id];
  let h='';
  if(q.stem) h+=`<div class="q-stem">${esc(q.stem)}</div>`;
  const txt=(q.textByGrade&&q.textByGrade[S.a.A1])||q.text;
  h+=`<h1 class="q">${esc(txt)}</h1>`;
  if(q.examples) h+=`<div class="q-ex">예를 들면 ${esc(q.examples)}</div>`;
  if(q.hint) h+=`<div class="q-hint">${esc(q.hint)}</div>`;
  if(q.scale==='number-grid'){
    const g=v||{};
    h+=`<div class="grid"><div class="ghead"><span>과목</span><span>원점수</span><span>과목평균</span></div><div class="rule top"></div>`;
    q.rows.forEach(r=>{const row=g[r]||{};
      h+=`<div class="grow"><span class="sb">${esc(r)}</span>
       <input inputmode="numeric" data-r="${esc(r)}" data-c="raw" value="${esc(row.raw||'')}" placeholder="－" aria-label="${esc(r)} 원점수">
       <input inputmode="numeric" data-r="${esc(r)}" data-c="mean" value="${esc(row.mean||'')}" placeholder="－" aria-label="${esc(r)} 과목평균"></div><div class="rule"></div>`;});
    return h+`</div>`;}
  if(q.scale==='region'){const r=v||{};
    h+=`<div style="margin-top:22px"><select id="sido"><option value="">시·도를 고르세요</option>${
      ((QI.A2.fields[0].options)||[]).map(x=>`<option${r.sido===x?' selected':''}>${esc(x)}</option>`).join('')}</select>
      <input class="txt" id="sigungu" style="margin-top:10px" placeholder="시·군·구" value="${esc(r.sigungu||'')}"></div>`;
    return h;}
  if(q.scale==='text') return h+`<textarea id="ta" maxlength="${q.maxLength||200}" placeholder="비워 두셔도 됩니다">${esc(v||'')}</textarea>`;
  h+=`<ul class="opts"><li class="rule top"></li>`;
  (q.options||[]).forEach(o=>{
    const on=q.scale==='multi'?(Array.isArray(v)&&v.includes(o.value)):v===o.value;
    h+=`<li class="opt${on?' on':''}" data-v="${esc(o.value)}" role="button" tabindex="0">
      <span class="dot${q.scale==='multi'?' sq':''}"></span><span class="lab">${esc(o.label)}${
      o.examples?`<span class="sub">${esc(o.examples)}</span>`:''}${o.hint?`<span class="sub">${esc(o.hint)}</span>`:''}</span></li><li class="rule"></li>`;});
  h+=`</ul>`;
  if(q.id==='B5'&&v==='A'){const g=S.a.B5f||{};
    h+=`<div class="grid"><div class="ghead"><span>과목</span><span>등급</span><span></span></div><div class="rule top"></div>`;
    [['kor','국어'],['mat','수학'],['eng','영어']].forEach(([k,n])=>{
      h+=`<div class="grow"><span class="sb">${n}</span><input inputmode="numeric" data-g="${k}" value="${esc(g[k]||'')}" placeholder="－" aria-label="${n} 등급"><span></span></div><div class="rule"></div>`;});
    h+=`</div><div class="q-hint">기억나는 과목만 적으셔도 됩니다.</div>`;}
  return h;
}
function render(){
  window.scrollTo(0,0);
  const A=APP();
  if(S.phase==='gate'&&!S.gate) return gateHTML(A);
  if(S.phase==='gate') S.phase='intro';
  if(S.phase==='intro') return introHTML(A);
  if(S.phase==='handoff') return handoffHTML(A);
  if(S.phase==='check') return checkHTML(A);
  if(S.phase==='result') return resultHTML(A);
  const qq=queue(); if(!qq.length||S.i>=qq.length){advance();return;}
  const q=QI[qq[S.i]], btn=NEEDBTN(q);
  A.innerHTML=barHTML()+`<main>${qHTML(q)}</main>`+
    (btn?`<div style="padding:6px 0 14px"><button class="btn" id="go"${answered(q.id)?'':' disabled'}>다음</button></div>`:'')+
    `<div class="foot"><div class="back${S.i===0?' off':''}" id="back"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>이전</div>
     <div class="tip">${btn?'':(q.by==='child'?'정답은 없어. 더 가까운 쪽을 고르면 돼':'고르시면 다음으로 넘어갑니다')}</div></div>`;
  wire(q);
}
function wire(q){
  const b=$('#back'); if(b) b.onclick=back;
  const go=$('#go'); if(go) go.onclick=()=>{ if(answered(q.id)) advance(); };
  const pick=el=>{const v=el.dataset.v;
    if(q.scale==='multi'){let c=S.a[q.id]||[];
      c = v==='none' ? (c.includes('none')?[]:['none'])
        : (c.includes(v)?c.filter(x=>x!==v):c.filter(x=>x!=='none').concat(v));
      S.a[q.id]=c;save();render();return;}
    S.a[q.id]=v;save();
    if(q.id==='B5'&&v==='A'){render();return;}
    render(); setTimeout(advance,140);};
  APP().querySelectorAll('.opt').forEach(el=>{
    el.onclick=()=>pick(el);
    el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(el);}};});
  APP().querySelectorAll('.grid input[data-r]').forEach(inp=>{inp.oninput=()=>{
    const g=S.a[q.id]||{},r=inp.dataset.r; g[r]=g[r]||{raw:'',mean:''};
    g[r][inp.dataset.c]=inp.value.replace(/\D/g,'').slice(0,3); S.a[q.id]=g;save();
    const gb=$('#go'); if(gb) gb.disabled=!answered(q.id);};});
  APP().querySelectorAll('.grid input[data-g]').forEach(inp=>{inp.oninput=()=>{
    const g=S.a.B5f||{}; g[inp.dataset.g]=inp.value.replace(/\D/g,'').slice(0,1); S.a.B5f=g;save();};});
  const sd=$('#sido'),sg=$('#sigungu');
  if(sd){const up=()=>{S.a[q.id]={sido:sd.value,sigungu:sg.value};save();
    const gb=$('#go'); if(gb) gb.disabled=!answered(q.id);}; sd.onchange=up; sg.oninput=up;}
  const ta=$('#ta'); if(ta) ta.oninput=()=>{S.a[q.id]=ta.value;save();};
}
