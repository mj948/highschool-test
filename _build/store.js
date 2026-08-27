/* ═══ 저장 · 관리자 ═══ */
const ADMIN_PASSWORD="guide2026";
const SUPABASE_URL="https://ihiuzfufngmbbresizzo.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_ohhFuQTtx3p7yWjPLXhZxg_2tZ3t67x";
const V2_KEY='guide_v2_responses', V31_KEY='hsc_v31_responses';
const cloudOn=()=>Boolean(SUPABASE_URL&&SUPABASE_ANON_KEY);
const H=()=>({'apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+SUPABASE_ANON_KEY,'Content-Type':'application/json'});
function localList(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return []}}
function buildRecord(r){
  const kidDone=KID.filter(visible).every(i=>S.a[i]!==undefined);
  return {schemaVersion:'v3.1',id:(S.rid||(S.rid=Date.now()+'-'+Math.random().toString(36).slice(2,8))),
    completedAt:new Date().toISOString(),grade:S.a.A1,region:S.a.A2||null,
    answers:S.a,elapsedMs:S.ms||null,kidCompleted:kidDone,
    result:{buckets:{primary:r.buckets.primary.map(b=>b.id),conditional:r.buckets.conditional.map(b=>b.id),low:r.buckets.low.map(b=>b.id)},
      reasons:Object.fromEntries(['primary','conditional','low'].flatMap(k=>r.buckets[k].map(b=>[b.id,b.reasons.map(x=>x.kind)]))),
      observations:r.obs.map(o=>o.text),interestAccepted:r.interest.acc,interestFlat:r.interest.flat,
      statedTracks:r.stated,gaps:r.gaps,branch:S.a.H1||null,typeRanking:!!r.frame.typeRanking}};
}
let saved=false;
function persist(r){
  if(saved) return; saved=true;
  const rec=buildRecord(r);
  try{const l=localList(V31_KEY); l.push(rec); localStorage.setItem(V31_KEY,JSON.stringify(l.slice(-2000)));}catch(e){}
  if(cloudOn()) fetch(SUPABASE_URL+'/rest/v1/responses',{method:'POST',
    headers:Object.assign(H(),{'Prefer':'return=minimal'}),
    body:JSON.stringify({id:rec.id,grade:rec.grade,completed_at:rec.completedAt,payload:rec})}).catch(()=>{});
}
/* ── 관리자 ── */
function adminOpen(){
  // prompt·alert도 아티팩트 안에서는 막힌다. 비밀번호를 화면 안에서 받는다.
  if(document.getElementById('admgate')) return;
  const g=document.createElement('div'); g.className='sheet'; g.id='admgate';
  g.innerHTML=`<div class="wrap" style="max-width:340px;padding-top:60px">
    <h2 style="font-family:var(--serif);margin:0 0 14px">관리자</h2>
    <input class="txt" id="admpw" type="password" placeholder="비밀번호" autocomplete="current-password">
    <div class="fine" id="admmsg" style="margin-top:8px"></div>
    <button class="btn" id="admok" style="margin-top:14px">들어가기</button>
    <button class="btn ghost" id="admno">닫기</button></div>`;
  document.body.appendChild(g);
  const close=()=>g.remove();
  g.querySelector('#admno').onclick=close;
  const tryOpen=()=>{
    if(g.querySelector('#admpw').value!==ADMIN_PASSWORD){
      g.querySelector('#admmsg').textContent='비밀번호가 다릅니다.'; return; }
    close(); adminSheet();};
  g.querySelector('#admok').onclick=tryOpen;
  g.querySelector('#admpw').onkeydown=e=>{if(e.key==='Enter') tryOpen();};
  g.querySelector('#admpw').focus();
}
function adminSheet(){
  const v31=localList(V31_KEY).map(r=>Object.assign({},r,{_v:'v3.1'}));
  const v2=localList(V2_KEY).map(r=>Object.assign({},r,{_v:'v2'}));
  const all=v31.concat(v2).sort((a,b)=>String(b.completedAt||'').localeCompare(String(a.completedAt||'')));
  const d=document.createElement('div'); d.className='sheet'; d.id='sheet';
  const GN={}; QUESTIONS.grades.forEach(g=>GN[g.id]=g.label);
  d.innerHTML=`<div class="wrap">
   <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
     <h2 style="font-family:var(--serif);margin:0">응답 ${all.length}건</h2>
     <button class="btn ghost" style="width:auto" id="cls">닫기</button></div>
   <div class="fine">v3.1 ${v31.length}건 · v2 ${v2.length}건. v2는 구버전 형식이라 새 판정을 적용하지 않고 원본만 보여 줍니다.<br>이 목록은 <b>이 기기 이 브라우저에 저장된 응답만</b> 보여 줍니다. 전체 응답은 Supabase 대시보드에서 확인하세요.</div>
   <div style="overflow-x:auto;margin-top:14px"><table><thead><tr>
     <th>버전</th><th>일시</th><th>학년</th><th>지역</th><th>우선 검토</th><th>조건 확인</th><th>우선순위 낮음</th><th>아이 문항</th></tr></thead><tbody>
   ${all.map((r,i)=>{
     if(r._v==='v2') return `<tr data-i="${i}"><td><span class="badge old">v2</span></td><td class="tnum">${esc((r.completedAt||'').slice(0,16).replace('T',' '))}</td>
       <td>${esc(r.grade||'')}</td><td colspan="5" style="color:var(--faint)">구버전 응답 — 눌러서 원본 보기</td></tr>`;
     const b=r.result?r.result.buckets:{primary:[],conditional:[],low:[]};
     return `<tr data-i="${i}"><td><span class="badge">v3.1</span></td><td class="tnum">${esc((r.completedAt||'').slice(0,16).replace('T',' '))}</td>
       <td>${esc(GN[r.grade]||r.grade||'')}</td><td>${esc(r.region?(r.region.sido||'')+' '+(r.region.sigungu||''):'')}</td>
       <td>${esc((b.primary||[]).join(', ')||'—')}</td><td>${esc((b.conditional||[]).join(', ')||'—')}</td>
       <td>${esc((b.low||[]).join(', ')||'—')}</td><td>${r.kidCompleted?'완료':'미완'}</td></tr>`;}).join('')}
   </tbody></table></div>
   <div style="display:flex;gap:8px;margin-top:16px"><button class="btn ghost" style="width:auto" id="csv">CSV 내보내기</button>
   <button class="btn ghost" style="width:auto" id="jsn">JSON 내보내기</button></div>
   <div id="det"></div></div>`;
  document.body.appendChild(d);
  d.querySelector('#cls').onclick=()=>d.remove();
  d.querySelectorAll('tr[data-i]').forEach(tr=>tr.onclick=()=>adminDetail(all[+tr.dataset.i]));
  d.querySelector('#jsn').onclick=()=>dl(JSON.stringify(all,null,2),'응답_'+new Date().toISOString().slice(0,10)+'.json','application/json');
  d.querySelector('#csv').onclick=()=>{
    const rows=[['버전','일시','학년','지역','우선검토','조건확인','우선순위낮음','아이문항','관심분야']];
    all.forEach(r=>{const b=(r.result&&r.result.buckets)||{};
      rows.push([r._v,(r.completedAt||'').slice(0,16),GN[r.grade]||r.grade||'',
        r.region?(r.region.sido||'')+' '+(r.region.sigungu||''):'',
        (b.primary||[]).join(' '),(b.conditional||[]).join(' '),(b.low||[]).join(' '),
        r.kidCompleted?'완료':'미완',((r.result&&r.result.interestAccepted)||[]).map(t=>TN[t]||t).join(' ')]);});
    dl('﻿'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n'),
       '응답_'+new Date().toISOString().slice(0,10)+'.csv','text/csv');};
}
function adminDetail(r){
  const box=document.getElementById('det'); if(!box) return;
  if(r._v==='v2'){box.innerHTML=`<div style="margin-top:20px"><div class="rule top"></div>
    <div class="fine" style="margin:12px 0">v2 구버전 응답입니다. 새 판정 로직을 적용하지 않습니다.</div>
    <pre style="font-family:var(--mono);font-size:11px;white-space:pre-wrap;word-break:break-all">${esc(JSON.stringify(r,null,2))}</pre></div>`;
    box.scrollIntoView({behavior:'smooth'});return;}
  const A=r.answers||{}, res=r.result||{};
  const lab=(id,v)=>{const q=QI[id]; if(!q) return v;
    if(q.scale==='multi') return (v||[]).map(x=>{const o=(q.options||[]).find(o=>o.value===x);return o?o.label:x;}).join(', ');
    if(typeof v==='object') return JSON.stringify(v);
    const o=(q.options||[]).find(o=>o.value===v); return o?o.label:v;};
  box.innerHTML=`<div style="margin-top:20px"><div class="rule top"></div>
   <h3 style="font-family:var(--serif);margin:14px 0 8px">응답 상세</h3>
   <div class="fine">${esc(r.completedAt||'')} · ${esc(r.schemaVersion)} · 소요 ${r.elapsedMs?Math.round(r.elapsedMs/1000)+'초':'—'}</div>
   <h4 style="margin:16px 0 6px;font-size:14px">공부 성향 요약</h4>
   ${(res.observations||[]).map(o=>`<div class="fine">· ${esc(o)}</div>`).join('')}
   ${(res.gaps||[]).length?'<h4 style="margin:16px 0 6px;font-size:14px">보호자·아이 응답 차이</h4>'+res.gaps.map(g=>`<div class="fine">· ${esc(g)}</div>`).join(''):''}
   <h4 style="margin:16px 0 6px;font-size:14px">문항별 응답</h4>
   <div style="overflow-x:auto"><table><tbody>
   ${Object.keys(A).filter(k=>QI[k]).map(k=>`<tr><td style="white-space:nowrap;color:var(--faint)">${esc(k)}</td>
     <td>${esc(QI[k].text)}</td><td>${esc(lab(k,A[k]))}</td></tr>`).join('')}
   </tbody></table></div></div>`;
  box.scrollIntoView({behavior:'smooth'});
}
async function saveFile(name,txt,type){
  // 아티팩트 안에서는 downloads 능력을 통해야 파일이 내려간다
  try{
    if(window.claude&&typeof window.claude.use==='function'){
      const d=await window.claude.use('downloads');
      if(d&&typeof d.save==='function'){ await d.save({filename:name,data:txt}); return true; }
    }
  }catch(e){}
  try{
    const b=new Blob([txt],{type:type+';charset=utf-8'}),u=URL.createObjectURL(b);
    const a=document.createElement('a'); a.href=u; a.download=name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(u),1000); return true;
  }catch(e){ return false; }
}
function dl(txt,name,type){ saveFile(name,txt,type); }
