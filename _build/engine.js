/* ═══ 판정 엔진 — RULES.json 만 읽는다. 하드코딩 금지 ═══ */
const QI={}; QUESTIONS.questions.forEach(q=>QI[q.id]=q);
const TRACKS=QUESTIONS.tracks, TN={}; TRACKS.forEach(t=>TN[t.id]=t.name);
const FREQ=QUESTIONS.scales.freq5.labels;           // 거의 매번 … 전혀 없다
const fval=v=>Number(v);                            // 5=거의 매번 … 1=전혀 없다
const lvl=(id,v)=>{const o=(QI[id].options||[]).find(o=>o.value===v);return o?(o.lvl||0):0;};
const pole=(id,v)=>{const o=(QI[id].options||[]).find(o=>o.value===v);return o?o.pole:null;};

function position(a){
  if(a.B1==='A'){
    const g=a.B2||{}, ks=Object.keys(g);
    if(ks.length===5&&ks.every(k=>g[k].raw!==''&&g[k].mean!=='')){
      const ds=ks.map(k=>+g[k].raw-+g[k].mean), raws=ks.map(k=>+g[k].raw);
      const d=ds.reduce((x,y)=>x+y,0)/5, mn=Math.min(...raws);
      for(const b of RULES.stage2.measured.bands)
        if(d>=b.delta&&(b.minRaw===undefined||mn>=b.minRaw)) return {pos:b.pos,src:'measured'};
    } return null;
  }
  const o=(QI.B3.options||[]).find(o=>o.value===a.B3);
  if(!o||o.noInfo) return null;
  const M=RULES.stage2.simple.map; let p=M[String(o.score)];
  if(p===undefined) return null;
  // 최상위 신호: 올 A + 3모 최상위면 상위 3%로 (점수만으론 최상위가 안 잡힌다)
  const ts=RULES.stage2.simple.topSignal, g=a.B5f;
  if(ts&&a.B3==='A'&&g){const vs=Object.values(g).map(Number).filter(x=>x>0);
    if(vs.length){const avg=vs.reduce((x,y)=>x+y,0)/vs.length; if(avg<=2) p=ts.pos;}}
  const lo=(QI.B4.options||[]).find(o=>o.value===a.B4);
  let pushed=false;
  if(lo&&!lo.noInfo){
    const order=QI.B3.options.filter(x=>!x.noInfo).map(x=>x.value);
    const gap=order.indexOf(a.B4)-order.indexOf(a.B3);
    if(gap>=2){ const vals=Object.values(M); const i=vals.indexOf(p);
      if(i>=0&&i<vals.length-1){p=vals[i+1];pushed=true;} }
  }
  return {pos:p,src:'simple',lowestPushed:pushed};
}
function signals(a){
  const S={};
  const rec=(lvl('F1',a.F1)+lvl('F2',a.F2))/2;
  S.recovery={v:rec,low:rec>0&&rec<=2};
  const hi=['D1','D2','D3'].filter(i=>fval(a[i])>=4).length;
  S.selfStandard={n:hi,high:hi>=2};
  const e1=fval(a.E1)>=4, e2=pole('E2',a.E2);
  S.competition={fuel:e1&&e2==='fuel',steady:e2==='steady'};
  let ef=null; const asked=a.C1!==undefined||a.C2!==undefined;
  const g=a.B5f, pp=position(a);
  if(g&&pp){const vs=Object.values(g).map(Number).filter(x=>x>0);
    if(vs.length){const avg=vs.reduce((x,y)=>x+y,0)/vs.length;
      if(pp.pos<=20&&avg>=3) ef='prepared'; if(pp.pos>50&&avg<=2) ef='unbounded';}}
  if(!ef&&asked){const p1=pole('C1',a.C1),p2=pole('C2',a.C2);
    ef=(p1==='prepared'||p2==='prepared')&&!(p1==='unbounded'&&p2==='unbounded')?'prepared':'unbounded';
    if(p1===p2) ef=p1||'prepared';}
  S.examFit={mode:ef,measured:!!(g&&pp),asked:asked};
  const gd=(pole('G1',a.G1)==='guided'&&pole('G2',a.G2)==='guided')||lvl('G3',a.G3)<=2;
  S.selfMgmt={guided:gd};
  S.peer={mode:pole('K3',a.K3)};
  return S;
}
function interest(a){
  const w={},acc=[];
  TRACKS.forEach(t=>{const v=a['K5-'+t.id]; w[t.id]=v?Number(v):0;});
  const vals=Object.values(w);
  const flat=vals.every(v=>v===vals[0])||!vals.some(v=>v>=3);
  if(!flat){const s=TRACKS.map(t=>t.id).sort((x,y)=>w[y]-w[x]);
    const top=w[s[0]];
    s.forEach(t=>{if(w[t]>=3&&acc.length<2&&(w[t]===top||acc.length===0||w[t]===w[s[0]]))acc.push(t);});
    if(!acc.length&&w[s[0]]>=3)acc.push(s[0]);
    if(acc.length<2&&w[s[1]]>=3&&w[s[1]]===w[s[0]])acc.push(s[1]);}
  return {w,acc,flat};
}
function evaluate(a){
  const gid=a.A1, gf=RULES.gradeFrames[gid]||{};
  const T={}; RULES.types.forEach(t=>T[t.id]=t);
  // 관심 계열: 아이가 고른 것 우선, 없으면 흥미 결과
  const IT=interest(a);
  const stated=(a.K4||[]).filter(x=>x!=='none');
  const picks=stated.length?stated:IT.acc;
  const prep=a.H1;                      // A 준비중 / B 관심 / C 고려안함
  // ① 자격 심사 — 관심·준비가 안 맞는 유형은 후보에서 뺀다
  const elig={};
  RULES.types.forEach(t=>{
    let ok=true;
    if(t.requiresInterest) ok=t.requiresInterest.some(x=>picks.includes(x));
    if(t.requiresPrep) ok=ok&&(prep==='A'||prep==='B');
    elig[t.id]=ok;
  });
  const state={}; RULES.types.forEach(t=>{ if(elig[t.id]) state[t.id]={bucket:'primary',reasons:[]}; });
  const match=c=>Object.keys(c).every(k=>{const w=c[k],g=a[k];return Array.isArray(w)?w.includes(g):g===w;});
  // ② 현실 조건 (통학·기숙·비용)
  RULES.stage1.hard.forEach(r=>{ if(match(r.if)) r.limit.forEach(t=>{
    if(state[t]){state[t].bucket='low';state[t].reasons.push({kind:r.reason,text:r.text});}});});
  RULES.stage1.soft.forEach(r=>{ if(match(r.if)) r.flag.forEach(t=>{
    if(state[t]&&state[t].bucket==='primary'){state[t].bucket='conditional';state[t].reasons.push({kind:r.reason,text:r.text});}});});
  // ③ 학력 위치
  const P=gf.typeRanking?position(a):null;
  const inside={};
  const skipPos=RULES.stage2.skipTypesForPosition||[];
  if(P) RULES.types.forEach(t=>{
    if(!state[t.id]||state[t.id].bucket==='low') return;
    if(skipPos.includes(t.id)) return;   // 별도 전형: 내신 등급으로 판정 안 함
    const p=P.pos/t.groupPct*100;
    if(p>RULES.stage2.cut.outOfGroup){state[t.id].bucket='low';
      state[t.id].reasons.push({kind:'position',text:'현재 성적 위치로는 이 유형의 지원자 범위 밖입니다. 학교보다 이번 학기 성적이 먼저입니다.'});}
    else{ inside[t.id]= p<=RULES.stage2.cut.inside;
      if(!inside[t.id]&&state[t.id].bucket==='primary'){state[t.id].bucket='conditional';
        state[t.id].reasons.push({kind:'position',text:'현재 성적 위치에서는 이 유형에 들어가더라도 상위권 유지가 쉽지 않을 수 있습니다. 한 학기 뒤 다시 확인해 보세요.'});}}});
  // ④ 기질·체질 (밀집 유형에만)
  const S=signals(a), obs=[]; const push=t=>obs.push({text:t});
  const g3=RULES.stage3.signals, sig=id=>g3.find(s=>s.id===id);
  const softenDense=(txt,kind)=>RULES.types.filter(t=>t.dense).forEach(t=>{
    if(state[t.id]&&state[t.id].bucket==='primary'){state[t.id].bucket='conditional';}
    if(state[t.id]&&state[t.id].bucket!=='low') state[t.id].reasons.push({kind:kind,text:txt});});
  if(S.recovery.low){push(sig('recovery').low.text);softenDense(sig('recovery').low.text,'recovery');}
  if(S.selfStandard.high){push(sig('self_standard').high.text);softenDense(sig('self_standard').high.text,'self_standard');}
  if(S.competition.fuel) push(sig('competition').fuel.text);
  else if(S.competition.steady){push(sig('competition').steady.text);softenDense(sig('competition').steady.text,'competition');}
  if(S.examFit.mode) push(sig('exam_fit')[S.examFit.mode].text);
  push(S.selfMgmt.guided?sig('self_management').guided.text:sig('self_management').self.text);
  if(S.peer.mode) push(sig('peer_pref')[S.peer.mode].text);
  // ⑤ 과학고·영재학교 별도 전형 안내 (후보로 남았을 때)
  ['과학고','영재학교'].forEach(t=>{ if(!state[t]) return;
    const txt=prep==='A'?RULES.specialBranch.H1_A:RULES.specialBranch.H1_B;
    state[t].reasons.unshift({kind:'special',text:txt});
    if(prep==='B'&&state[t].bucket==='primary') state[t].bucket='conditional';});
  // 목표 계열 확인 안내
  const notes=[];
  RULES.stage4.curriculum.forEach(c=>{ if(c.handled==='eligibility') return;
    if(c.if.includes('이공')&&picks.includes('eng')) notes.push(c.text);
    if(c.if.includes('메디컬')&&picks.includes('med')) notes.push(c.text);
    if(c.if.includes('인문·사회')&&picks.includes('soc')) notes.push(c.text);});
  // 응답 차이
  const gaps=[];
  if(pole('G1',a.G1)==='guided'&&pole('K2',a.K2)==='self') gaps.push(RULES.stage3.gapReport.text);
  if(pole('E2',a.E2)==='steady'&&pole('K1',a.K1)==='fuel')
    gaps.push('아이는 잘하는 친구가 많은 반에서 공부가 더 잘될 것 같다고 했고, 보호자는 잘하고 있다는 느낌이 있을 때 안정적이라고 보셨습니다. 실제로 성적이 흔들렸던 시기에 어떻게 반응했는지 함께 떠올려 보세요.');
  const buckets={primary:[],conditional:[],low:[]};
  RULES.types.forEach(t=>{ if(state[t.id]) buckets[state[t.id].bucket].push({id:t.id,reasons:state[t.id].reasons}); });
  const excluded=RULES.types.filter(t=>!elig[t.id]).map(t=>t.id);
  return {grade:gid,frame:gf,pos:P,signals:S,obs,interest:IT,picks,stated,notes,gaps,buckets,excluded,
          needTB1:gf.typeRanking&&buckets.primary.length>=2,
          needTB2:gf.typeRanking&&(buckets.primary.concat(buckets.conditional)).some(b=>b.id==='외고'||b.id==='국제고')
                  &&picks.includes('lang')&&picks.includes('intl')};
}
function sincerity(a,ms){
  const f=[];
  const n=Object.keys(a).length;
  if(ms&&n>0&&ms/n<3000) f.push('pace');
  const fr=['D1','D2','D3','E1'].map(i=>a[i]).filter(Boolean);
  const it=TRACKS.map(t=>a['K5-'+t.id]).filter(Boolean);
  if(fr.length>=4&&new Set(fr).size===1&&it.length>=6&&new Set(it).size===1) f.push('straight');
  return f;
}
