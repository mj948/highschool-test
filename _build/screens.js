/* ═══ 시작·전환·확인·결과 ═══ */
function introHTML(A){
  const g=S.a.A1;
  A.innerHTML=`<div class="bar"></div><main class="center">
   <div class="mark"></div><h1 class="big">고교선택검사</h1>
   <div class="lead">아이가 어떤 조건에서 공부가 잘 유지되는지 정리하고,<br>학교를 비교할 때 무엇을 확인해야 하는지 알려 드립니다.</div>
   <div class="facts"><div class="rule"></div>
    <div class="fact"><span class="k">대상</span><span class="v">초등 1학년 ~ 중학교 3학년</span></div><div class="rule"></div>
    <div class="fact"><span class="k">문항</span><span class="v tnum">24 ~ 31개</span></div><div class="rule"></div>
    <div class="fact"><span class="k">걸리는 시간</span><span class="v">10분 안팎</span></div><div class="rule"></div>
    <div class="fact"><span class="k">답하는 사람</span><span class="v">보호자와 아이</span></div><div class="rule"></div></div>
   <div class="fine">${esc(RULES.outputPolicy.disclaimer)}<br><br>
    중학생은 성적표가 있으면 더 정확합니다. 없어도 진행할 수 있습니다.<br>초등학생에게는 성적과 시험을 묻지 않고, 학년이 낮을수록 문항이 줄어듭니다.<br>
    중간에 닫으셔도 이어서 하실 수 있습니다.</div></main>
   <div style="padding:0 0 18px"><button class="btn" id="start">시작하기</button>
   ${Object.keys(S.a).length?'<button class="btn ghost" id="reset">처음부터 다시</button>':''}</div>`;
  $('#start').onclick=()=>{S.phase='mo';S.i=0;S.t0=Date.now();save();render();};
  const r=$('#reset'); if(r) r.onclick=()=>{S={a:{},i:0,phase:'intro',t0:0,ms:0};save();render();};
}
function handoffHTML(A){
  const n=KID.filter(visible).length;
  A.innerHTML=`<div class="bar"></div><main class="center">
   <div class="mark amber"></div><h1 class="big">여기부터는<br>아이가 직접 답합니다</h1>
   <div class="lead">${n}문항이고 2분이면 끝납니다.<br>정답은 없습니다. 둘 중 더 가까운 쪽을 골라 주세요.</div>
   <div class="fine">보호자가 대신 답하셔도 결과는 나옵니다. 다만 관심 분야와 공부 환경 선호는 아이 답이 더 정확하고,
   보호자 답과 다를 때는 그 차이 자체를 결과에 적어 드립니다.</div></main>
   <div style="padding:0 0 18px"><button class="btn" id="go2">아이에게 넘기기</button>
   <button class="btn ghost" id="skip">나중에 하고 결과 먼저 보기</button></div>`;
  $('#go2').onclick=()=>{S.phase='kid';S.i=0;save();render();};
  $('#skip').onclick=()=>{S.res=evaluate(S.a);S.phase='result';save();render();};
}
function checkHTML(A){
  A.innerHTML=`<div class="bar"></div><main class="center"><div class="mark"></div>
   <h1 class="big">${esc(RULES.sincerity.screen.title)}</h1>
   <div class="lead">${esc(RULES.sincerity.screen.text)}</div></main>
   <div style="padding:0 0 18px"><button class="btn" id="again">문항 다시 보기</button>
   <button class="btn ghost" id="skip2">${esc(RULES.sincerity.screen.skip)}</button></div>`;
  $('#again').onclick=()=>{S.checked=1;S.phase='mo';S.i=0;save();render();};
  $('#skip2').onclick=()=>{S.checked=1;
    if(TB.filter(visible).length){S.phase='tb';S.i=0;} else S.phase='result';
    save();render();};
}
const BUCKET_ICON={primary:'',conditional:'',low:''};
function resultHTML(A){
  const r=S.res||evaluate(S.a); S.res=r;
  const gf=r.frame, T=RULES.resultSections;
  const GN={}; QUESTIONS.grades.forEach(g=>GN[g.id]=g.label);
  const d=new Date(), ds=`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}.`;
  let h=`<div class="bar"></div><main class="res">
   <div class="print-head"><p class="t">고교선택검사 결과</p>
     <div class="m"><span>${esc(GN[r.grade]||'')}</span>${S.a.A2&&S.a.A2.sido?`<span>${esc(S.a.A2.sido)} ${esc(S.a.A2.sigungu||'')}</span>`:''}<span>${ds}</span></div></div>`;
  h+=`<section style="padding-top:40px"><div class="eyebrow">결과</div>
      <h2>${esc(gf.title||'답변에서 확인된 공부 성향')}</h2>`;
  if(gf.caveat) h+=`<div class="note amber">${esc(gf.caveat)}</div>`;
  h+=`<div class="rule top" style="margin-top:20px"></div>`;
  r.obs.forEach(o=>{h+=`<div class="obs">${esc(o.text)}</div><div class="rule"></div>`;});
  h+=`</section>`;
  const IT=r.interest;
  h+=`<section><div class="eyebrow">관심</div><h2>아이가 더 관심을 보인 활동</h2>`;
  if(Object.values(IT.w).some(v=>v>0)){
    h+=`<div class="rule top" style="margin-top:18px"></div>`;
    QUESTIONS.tracks.slice().sort((a,b)=>IT.w[b.id]-IT.w[a.id]).forEach(t=>{
      const n=IT.w[t.id],on=IT.acc.includes(t.id);
      h+=`<div class="trk${on?' on':''}"><span class="n">${esc(t.name)}</span><span class="pips">${
        [1,2,3,4].map(i=>`<span class="pip${i<=n?' f':''}"></span>`).join('')}</span></div><div class="rule"></div>`;});
    if(IT.flat) h+=`<div class="note">${esc(RULES.stage4.interest.flat.text)}</div>`;
    else h+=`<div class="note">${esc(IT.acc.map(t=>TN[t]).join('과 '))} 활동에 상대적으로 더 관심을 보였습니다.</div>`;
    if(r.stated.length&&IT.acc.length&&!IT.acc.every(t=>r.stated.includes(t))){
      const m=IT.acc.filter(t=>!r.stated.includes(t)).map(t=>TN[t]).join('과 ');
      h+=`<div class="note amber">${esc(RULES.stage4.stated.mismatch.replace('{stated}',r.stated.map(t=>TN[t]).join('과 ')).replace('{measured}',m))}</div>`;}
  } else h+=`<div class="note">아이 문항을 아직 하지 않으셨습니다. 관심 분야는 아이가 직접 답해야 나옵니다.</div>`;
  h+=`</section>`;
  if(gf.typeRanking){
    h+=`<section><div class="eyebrow">학교 유형</div><h2>세 묶음으로 정리했습니다</h2>
        <div class="fine" style="margin-top:10px">묶음 안에서 순위를 매기지 않습니다. 점수도 매기지 않습니다.</div>`;
    RULES.stage5.buckets.forEach(b=>{
      const list=r.buckets[b.id]; if(!list.length) return;
      h+=`<div class="rule top" style="margin-top:20px"></div><div class="bucket"><div class="tag">${esc(b.title)}</div>`;
      list.forEach(x=>{h+=`<div class="bt">${esc(x.id)}</div>`;
        if(x.reasons.length) x.reasons.forEach(rs=>{h+=`<div class="bd">${esc(rs.text)}</div>`;});
        else h+=`<div class="bd">현재 조건에서 특별히 걸리는 부분이 없었습니다.</div>`;});
      h+=`</div>`;});
    h+=`<div class="rule"></div>`;
    if(S.a.TB1){const p=(QI.TB1.options.find(o=>o.value===S.a.TB1)||{}).pole;
      h+=`<div class="note">${p==='curriculum'?'과목과 활동 선택 폭을 조금 더 우선하겠다고 하셨습니다. 남은 후보 중 개설 과목이 넓은 학교부터 비교해 보세요.':'현재 성적 위치를 지키는 쪽을 조금 더 우선하겠다고 하셨습니다. 남은 후보 중 같은 성적대 학생이 많은 학교부터 비교해 보세요.'}</div>`;}
    if(S.a.TB2){const p=(QI.TB2.options.find(o=>o.value===S.a.TB2)||{}).pole;
      h+=`<div class="note">${p==='language'?'아이는 외국어 자체를 배우는 활동에 더 관심을 보였습니다. 외국어고 교육과정을 먼저 비교해 볼 이유가 있습니다.':'아이는 외국어로 국제 문제를 다루는 활동에 더 관심을 보였습니다. 국제고 교육과정을 먼저 비교해 볼 이유가 있습니다.'}</div>`;}
    h+=`</section>`;
  } else {
    h+=`<section><div class="eyebrow">학교 유형</div><h2>${esc(gf.title||'지금 살펴볼 것')}</h2>
        <div class="note">${esc(gf.note||'')}</div></section>`;
  }
  if(r.branch) h+=`<section><div class="eyebrow">별도 전형</div><h2>과학고·영재학교</h2>
      <div class="note">${esc(r.branch.text)}</div></section>`;
  if(r.gaps.length){h+=`<section><div class="eyebrow">응답 차이</div><h2>보호자와 아이의 답이 다른 부분</h2>`;
    r.gaps.forEach(g=>h+=`<div class="note">${esc(g)}</div>`); h+=`</section>`;}
  h+=`<section><div class="eyebrow">확인</div><h2>학교별로 반드시 확인할 것</h2><div class="rule top" style="margin-top:18px"></div>`;
  RULES.checklist.forEach(c=>{h+=`<div class="bucket"><div class="bt">${esc(c.t)}</div><div class="bd">${esc(c.d)}</div></div><div class="rule"></div>`;});
  r.notes.forEach(n=>h+=`<div class="note">${esc(n)}</div>`);
  h+=`</section>`;
  h+=`<section><div class="eyebrow">다음</div><h2>이번 학기에 할 일</h2><div class="note">${esc(nextAction(r))}</div></section>`;
  const ctx=[S.a.I1,S.a.I2].filter(x=>x&&x.trim());
  if(ctx.length){h+=`<section><div class="eyebrow">적어 주신 내용</div><h2>상담에 함께 봅니다</h2>`;
    ctx.forEach(c=>h+=`<div class="note">${esc(c)}</div>`); h+=`</section>`;}
  h+=`<div class="disclaim">${esc(RULES.outputPolicy.disclaimer)}</div></main>
      <div style="padding:14px 0 40px">
      ${KID.filter(visible).some(i=>S.a[i]===undefined)?'<button class="btn" id="kid">아이 문항 마저 하기</button>':''}
      <button class="btn" id="prt">결과 인쇄 · PDF로 저장</button>
      <div class="fine" id="prtmsg" style="text-align:center;margin-top:8px">인쇄 창에서 <b>대상</b>을 <b>PDF로 저장</b>으로 바꾸시면 파일로 남습니다.</div>
      <button class="btn ghost" id="again2">처음부터 다시</button></div>`;
  A.innerHTML=h;
  const k=$('#kid'); if(k) k.onclick=()=>{S.phase='kid';S.i=0;save();render();};
  $('#prt').onclick=doPrint;
  $('#again2').onclick=()=>{ if(confirm('답을 모두 지우고 처음부터 진행할까요?')){
    S={a:{},i:0,phase:'intro',t0:0,ms:0};save();render();}};
  persist(r);
}
function nextAction(r){
  if(S.a.B5==='B') return '이번 주말에 고등학교 1학년 3월 모의고사를 한 과목만 시간을 재고 풀려 보세요. 중학교 성적표로는 보이지 않는 부분이 거기서 보입니다.';
  if(!r.frame.typeRanking) return '지금 시점에는 학교를 좁히기보다, 위에 적힌 공부 성향 중 한 가지를 골라 한 학기 동안 지켜봐 주세요.';
  if(r.signals.selfMgmt.guided) return '다음 한 주 동안 아이가 스스로 계획을 세워 보게 하고, 며칠이나 지켜지는지 확인해 보세요. 학교의 학습 관리 방식을 물어볼 때 기준이 됩니다.';
  return '관심 있는 학교 두 곳의 편제표를 열어, 아이가 관심을 보인 분야의 과목이 실제로 개설되는지 확인해 보세요.';
}

async function doPrint(){
  const btn=$('#prt');
  const setMsg=t=>{const m=$('#prtmsg'); if(m) m.innerHTML=t;};
  // 아티팩트·임베드처럼 다른 페이지 안에 들어 있으면 인쇄 창이 안 열린다
  const embedded=(()=>{try{return window.self!==window.top}catch(e){return true}})();
  if(!embedded){
    try{ window.print(); return; }catch(e){}
  }
  setMsg('결과 파일을 만들고 있습니다…');
  const ok=await saveResultFile();
  setMsg(ok
    ? '결과 파일을 받으셨습니다. 그 파일을 열고 <b>인쇄 → 대상을 PDF로 저장</b>으로 바꾸시면 됩니다.'
    : '이 화면에서는 인쇄 창이 열리지 않습니다. 브라우저 메뉴의 인쇄 기능을 쓰시거나, 검사를 별도 주소로 열어 주세요.');
  if(btn) btn.textContent='결과 파일 다시 받기';
}
async function saveResultFile(){
  const style=document.querySelector('style');
  const main=document.querySelector('main.res');
  if(!main) return false;
  const html='<!doctype html><html lang="ko"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>고교선택검사 결과</title>'+
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap">'+
    '<style>'+(style?style.textContent:'')+
    '.print-head{display:block!important;margin:0 0 18px;padding-bottom:12px;border-bottom:1.5px solid var(--ink)}'+
    '.print-head .t{font-family:var(--serif);font-size:22px;font-weight:700;margin:0}'+
    '.print-head .m{font-size:12px;color:var(--muted);margin-top:6px;display:flex;gap:14px;flex-wrap:wrap}'+
    '</style></head><body><div class="app"><main class="res">'+main.innerHTML+'</main></div></body></html>';
  return await saveFile('고교선택검사_결과_'+new Date().toISOString().slice(0,10)+'.html', html, 'text/html');
}
