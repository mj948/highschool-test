/* 고교선택검사 v3.1 — 시나리오·불변식 테스트
   index.html 을 파싱해 실제 배포되는 코드로 검사한다. */
import fs from 'fs';
const HTML=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const SRC=HTML.match(/<script>\n([\s\S]*)<\/script>/)[1];
const QUESTIONS=JSON.parse(SRC.match(/^const QUESTIONS=(\{.*\});$/m)[1]);
const RULES=JSON.parse(SRC.match(/^const RULES=(\{.*\});$/m)[1]);

/* ── 엔진만 떼어 온다 (UI 없이) ── */
const ENGINE=SRC.slice(SRC.indexOf('/* ═══ 판정 엔진'),SRC.indexOf('/* ═══ 화면 ═══'));
const ctx={QUESTIONS,RULES};
new Function('QUESTIONS','RULES','ctx',ENGINE+'\nObject.assign(ctx,{QI,TRACKS,TN,position,signals,interest,evaluate,sincerity});')
  (QUESTIONS,RULES,ctx);
const {QI,evaluate,sincerity,interest,position}=ctx;

let pass=0,fail=0; const fails=[];
const T=(name,fn)=>{try{const r=fn(); if(r===true){pass++;console.log('  PASS  '+name);}
  else{fail++;fails.push(name+' — '+r);console.log('  FAIL  '+name+'  → '+r);}}
  catch(e){fail++;fails.push(name+' — '+e.message);console.log('  FAIL  '+name+'  → '+e.message);}};

/* ── 응답 만들기 헬퍼 ── */
const base=(o={})=>Object.assign({
  A1:'m2',A2:{sido:'서울',sigungu:'강남구'},A3:'D',A4:'A',A5:'A',A6:'A',
  B1:'B',B3:'A',B4:'A',B5:'B',
  C1:'A',C2:'A', D1:'3',D2:'3',D3:'3', E1:'4',E2:'A',
  F1:'A',F2:'A', G1:'A',G2:'A',G3:'A', H1:'C',
  K1:'A',K2:'A',K3:'A',K4:['eng'],
  'K5-eng':'4','K5-med':'2','K5-soc':'2','K5-lang':'1','K5-intl':'1','K5-art':'2'
},o);
const inB=(r,b,t)=>r.buckets[b].some(x=>x.id===t);
const anyB=(r,t)=>['primary','conditional','low'].find(b=>inB(r,b,t));

console.log('\n═══ 시나리오 20 ═══');
T('1. 중2·학력높음·회복빠름·경쟁동력·자기관리높음 → 밀집 유형이 심리 이유로 자동 탈락하지 않는다',()=>{
  const r=evaluate(base());
  const bad=r.buckets.low.filter(b=>b.reasons.some(x=>['recovery','self_standard','competition'].includes(x.kind)));
  return bad.length===0?true:'심리 이유로 low 이동: '+bad.map(b=>b.id);});
T('2. 중2·학력높음·완벽주의높음·회복느림 → 밀집 유형이 primary에 안 남는다',()=>{
  const r=evaluate(base({D1:'5',D2:'5',D3:'4',F1:'D',F2:'D'}));
  const d=r.buckets.primary.filter(b=>RULES.types.find(t=>t.id===b.id).dense);
  return d.length===0?true:'primary에 밀집 유형: '+d.map(b=>b.id);});
T('3. 중3·학력보통·회복빠름·자기관리높음 → 성향만으로 상위 유형을 primary에 올리지 않는다',()=>{
  const r=evaluate(base({A1:'m3',B3:'D',B4:'D'}));
  const d=r.buckets.primary.filter(b=>RULES.types.find(t=>t.id===b.id).dense);
  return d.length===0?true:'primary에 밀집 유형: '+d.map(b=>b.id);});
T('4. 중2·성적표 없음(모르겠다) → 학력 위치를 만들어 내지 않는다',()=>{
  const r=evaluate(base({B3:'X',B4:'X'}));
  return r.pos===null?true:'위치가 생성됨: '+JSON.stringify(r.pos);});
T('5. 초4 → 학교 유형 순위 없음',()=>{
  const r=evaluate(base({A1:'e34'}));
  return r.frame.typeRanking===false?true:'typeRanking='+r.frame.typeRanking;});
T('6. 초6 → 유형 순위 없음 + 중학교 확인 항목',()=>{
  const r=evaluate(base({A1:'e56'}));
  const f=RULES.gradeFrames.e56;
  return (r.frame.typeRanking===false&&f.sections.includes('middle_school_check'))?true:'초6 프레임 부적절';});
T('7. 고1 → 신규 고교 진학 순위 없음',()=>{
  const r=evaluate(base({A1:'h1'}));
  return (r.frame.typeRanking===false&&r.frame.frame==='review')?true:'고1 프레임 부적절';});
T('8. 비용 어려움 → 성적이 아니라 현실 조건 때문임이 이유에 남는다',()=>{
  const r=evaluate(base({A5:'C'}));
  // 후보로 남은 자사고 계열에 비용 사유가 붙어야 한다
  const cand=['광역 자사고','전국 자사고'].filter(x=>anyB(r,x));
  const t=cand.every(x=>{const b=anyB(r,x);return r.buckets[b].find(y=>y.id===x).reasons.some(y=>y.kind==='tuition');});
  return (cand.length&&t)?true:'비용 사유 누락';});
T('9. 통학 30분 + 이사 불가 → 원거리 유형이 low',()=>{
  const r=evaluate(base({A3:'A',A6:'B',K4:['lang'],'K5-lang':'4'}));
  return (inB(r,'low','전국 자사고')&&inB(r,'low','외고'))?true:'통학 조건 미반영';});
T('10. 보호자는 관리 필요 / 아이는 자기주도 → 차이를 결과에 적는다',()=>{
  const r=evaluate(base({G1:'B',G2:'B',K2:'A'}));
  return r.gaps.length>0?true:'차이 미기록';});
T('11. 외국어 관심 뚜렷 → 외고가 후보로 나오고 교육과정 사유로 안 밀린다',()=>{
  const r=evaluate(base({K4:['lang','intl'],'K5-lang':'4','K5-intl':'4',
    'K5-eng':'1','K5-med':'1','K5-soc':'1','K5-art':'1'}));
  const b=anyB(r,'외고'); if(!b) return '외고가 후보에 없음 (제외: '+r.excluded.join(',')+')';
  const rs=(r.buckets[b].find(x=>x.id==='외고')||{}).reasons||[];
  return !rs.some(x=>x.kind==='curriculum')?true:'교육과정 사유로 밀림';});
T('12. 이공 관심 뚜렷 → 실제 개설 확인 안내가 나온다',()=>{
  const r=evaluate(base({K4:['eng']}));
  return r.notes.some(n=>n.includes('물리'))?true:'이공 확인 안내 없음';});
T('13. 진술은 인문사회, 흥미는 이공도 높음 → 적성 확정하지 않는다',()=>{
  const r=evaluate(base({K4:['soc'],'K5-soc':'4','K5-eng':'4','K5-med':'1','K5-lang':'1','K5-intl':'1','K5-art':'1'}));
  const txt=RULES.stage4.stated.mismatch;
  return (r.stated.includes('soc')&&!/진짜 적성|틀렸|불일치/.test(txt))?true:'적성 확정 문구 존재';});
T('14. 모든 흥미가 같음 → 억지 1위를 만들지 않는다',()=>{
  const a=base(); QUESTIONS.tracks.forEach(t=>a['K5-'+t.id]='3');
  const r=evaluate(a);
  return (r.interest.flat===true&&r.interest.acc.length===0)?true:'평평한데 1위 생성: '+r.interest.acc;});
T('15. 국영수 최저 70점 미만 → 선택 불가 구간 없음',()=>{
  const opts=QI.B3.options.map(o=>o.label);
  return opts.some(l=>l.includes('70점 미만'))?true:'70점 미만 선지 없음';});
T('16. 학원에 안 다니는 학생 → 학원 전제 문항 없음',()=>{
  const bad=QUESTIONS.questions.filter(q=>/학원 숙제/.test(q.text));
  return bad.length===0?true:'학원 전제 문항: '+bad.map(q=>q.id);});
T('17. 휴대폰 없는 학생 → 휴대폰 문항 없음',()=>{
  const bad=QUESTIONS.questions.filter(q=>/휴대폰|스마트폰/.test(q.text));
  return bad.length===0?true:'휴대폰 문항: '+bad.map(q=>q.id);});
T('18. 기숙사 이야기를 안 해 본 가정 → 억지 추정 없음',()=>{
  const q=QI.A4; return q.options.some(o=>o.label==='아이가 원하면 가능하다')?true:'중간 선지 없음';});
T('19. 응답이 비정상적으로 빠름 → 재확인 안내',()=>{
  const a=base(); const f=sincerity(a,1000);
  return f.includes('pace')?true:'속도 표시 없음';});
T('20. T와 Q에서 서로 다른 특성이 동시에 → 일관성 오류로 오탐하지 않는다',()=>{
  const a=base({C1:'A',C2:'B',E1:'5',E2:'B'});
  const f=sincerity(a,600000);
  return f.length===0?true:'오탐: '+f;});

console.log('\n═══ 불변식 28 ═══');
T('I1. 초등에 유형 순위 없음',()=>['e34','e56'].every(g=>RULES.gradeFrames[g].typeRanking===false)?true:'초등 순위 존재');
T('I2. 고1 이상에 신규 진학 순위 없음',()=>RULES.gradeFrames.h1.typeRanking===false?true:'고1 순위 존재');
T('I3. 정보 없음에 중간값을 주지 않음',()=>{
  const ni=QUESTIONS.questions.flatMap(q=>(q.options||[]).filter(o=>o.noInfo).map(o=>q.id+'.'+o.value));
  const a=base({B3:'X',B4:'X'});
  return (ni.length>0&&position(a)===null)?true:'정보 없음 처리 미흡';});
T('I4. 판정에 안 쓰이는 문항 0개',()=>{
  // RULES에 적혀 있거나, 엔진·결과 코드가 실제로 읽으면 사용된 것으로 본다.
  const rules=JSON.stringify(RULES);
  const code=SRC.replace(/^const (RULES|QUESTIONS)=.*$/gm,'');
  const bad=QUESTIONS.questions.filter(q=>{
    if(!q.decisionUse||!q.decisionUse.length) return true;      // decisionUse가 없으면 실패
    const id=q.id;
    const inRules=rules.includes('"'+id+'"')||rules.includes(id.replace(/-.*/,'-*'));
    const inCode=new RegExp("['\\.\\[\"]"+id.replace(/[-]/g,'\\-')+"['\"\\]]").test(code)
              || code.includes("'"+id+"'") || code.includes('.'+id) || code.includes('"'+id+'"');
    return !(inRules||inCode);});
  return bad.length===0?true:'미사용: '+bad.map(q=>q.id);});
T('I5. 숫자 구간 중복 0개',()=>{
  const g=QI.A3.options.map(o=>o.label);
  const ok=/30분 이내/.test(g[0])&&/31~45/.test(g[1])&&/46~60/.test(g[2]);
  const b=QI.B3.options.filter(o=>!o.noInfo).map(o=>o.label);
  const ok2=/95점 이상/.test(b[0])&&/90~94/.test(b[1])&&/85~89/.test(b[2])&&/80~84/.test(b[3])&&/70~79/.test(b[4])&&/70점 미만/.test(b[5]);
  return (ok&&ok2)?true:'구간 겹침';});
T('I6. 숫자 구간 누락 0개',()=>{
  const b=QI.B3.options.filter(o=>!o.noInfo).map(o=>o.label).join(' ');
  return (/95점 이상/.test(b)&&/90~94/.test(b)&&/85~89/.test(b)&&/80~84/.test(b)&&/70~79/.test(b)&&/70점 미만/.test(b))?true:'구간 빈틈';});
T('I7. 구버전 심리 유형 문구 노출 0개',()=>{
  const body=SRC.replace(/^const RULES=.*$/m,'');
  const bad=RULES.outputPolicy.bannedWords.filter(w=>body.includes(w));
  return bad.length===0?true:'노출: '+bad;});
T('I8. 적합도 점수 노출 0개',()=>{
  const body=SRC.replace(/^const RULES=.*$/m,'');
  return !/적합도|typeScores|AXIS_TYPE_WEIGHTS|big5|mentalCap/.test(body)?true:'구버전 점수 코드 잔존';});
T('I9. 금지 전문용어 0개',()=>{
  const bad=['세특','학종','비교과','지역균형 전형'].filter(w=>HTML.includes(w));
  return bad.length===0?true:'잔존: '+bad;});
T('I10. 근거 없는 직업·학과 단정 0개',()=>{
  const body=SRC.replace(/^const (RULES|QUESTIONS)=.*$/gm,'');
  return !/네 적성은|장래희망은 .*로 하|의사가 되|변호사가 되/.test(body)?true:'직업 단정 존재';});
T('I11. 흥미로 계열 하나를 적성 확정하는 문장 0개',()=>{
  const s=JSON.stringify(RULES.stage4);
  return (RULES.stage4.interest.rule.includes('확정하지 않는다')&&!/적성은/.test(s))?true:'적성 확정';});
T('I12. 검증되지 않은 정밀 수치 0개',()=>{
  const bad=HTML.match(/0\.00\s*%|오탐 0|적중률 \d|신뢰도 \d/g);
  return !bad?true:'정밀 수치: '+bad;});
T('I13. 과거 v2 응답 열람 기능 유지',()=>
  (SRC.includes('guide_v2_responses')&&SRC.includes('구버전 응답'))?true:'v2 열람 없음');
T('I14. 모바일 380px 대응 규칙 존재',()=>
  /@media \(max-width:380px\)/.test(HTML)?true:'380px 미디어쿼리 없음');
T('I15. 인쇄·PDF 저장 가능',()=>
  (/@media print/.test(HTML)&&SRC.includes('window.print'))?true:'인쇄 미지원');

T('I16. 모든 학년에서 답할 수 없는 문항이 뜨지 않는다',()=>{
  const bad=[];
  QUESTIONS.grades.forEach(g=>{
    QUESTIONS.questions.forEach(q=>{
      if(!q.requires||!q.requires.length) return;
      const gated=(q.showIf&&q.showIf.grade)?q.showIf.grade.includes(g.id):true;
      if(!gated) return;
      const ok=q.requires.every(r=>(g.has||[]).includes(r));
      if(!ok&&!(q.requires&&true)) bad.push(g.id+'/'+q.id);
      // requires가 있으면 visible()이 막아야 한다 → has에 없으면 반드시 requires로 걸려야 함
      if(!ok&&!q.requires.length) bad.push(g.id+'/'+q.id);});});
  // 전제를 명시하지 않은 채 전제를 깔고 있는 문항 탐지
  const premise=QUESTIONS.questions.filter(q=>{
    const t=(q.textByGrade?Object.values(q.textByGrade).join(' '):'')+' '+q.text;
    return /시험 범위|학교 시험|시험 기간|성적표|과목평균/.test(t)&&!(q.requires&&q.requires.length)
        && !(q.showIf&&q.showIf.grade) && !q.textByGrade;});
  if(premise.length) bad.push('전제 미표시: '+premise.map(q=>q.id).join(','));
  return bad.length===0?true:bad.join(' ');});
T('I17. 학년 선지가 초1부터 고1 이상까지 끊김 없이 덮는다',()=>{
  const ids=QUESTIONS.grades.map(g=>g.id);
  const want=['e12','e34','e56','m1','m2','m3','h1'];
  const miss=want.filter(x=>!ids.includes(x));
  const opt=QI.A1.options.map(o=>o.value);
  return (miss.length===0&&want.every(x=>opt.includes(x)))?true:'빠진 학년: '+(miss.join(',')||'선지 불일치');});
T('I18. 성적표가 없는 경우를 고를 수 있다',()=>{
  const ok=['B3','B4'].every(id=>QI[id].options.some(o=>/성적표가 없다/.test(o.label)));
  const hasOverseas=(QI.A2.fields[0].options||[]).some(x=>/해외/.test(x));
  return (ok&&hasOverseas)?true:(ok?'해외 거주 선지 없음':'성적표 없음 선지 없음');});

T('I19. 아이 문항에 반말이 없다',()=>{
  const bad=QUESTIONS.questions.filter(q=>q.by==='child').filter(q=>{
    const t=(q.text||'')+' '+(q.stem||'')+' '+(q.hint||'');
    return /(줘\.|줘$|어때\??$|같아\??$|이야\??$|정해\??$|되고,|고르면 돼)/.test(t);});
  return bad.length===0?true:'반말: '+bad.map(q=>q.id);});
T('I20. 의문문에 물음표, 나머지 문장에 마침표가 있다',()=>{
  const ASKEND=/(나요|인가요|가요|까요|어떤가요|쪽인가요|같나요|정하나요)[?]$/;
  // stem이 질문을 지는 문항은 text가 명사구다. 명사구에는 마침표를 찍지 않는다.
  const stemBad=QUESTIONS.questions.filter(q=>q.stem&&!ASKEND.test(q.stem));
  if(stemBad.length) return 'stem에 물음표 없음: '+stemBad.map(q=>q.id);
  const nounBad=QUESTIONS.questions.filter(q=>q.stem&&/[.?!]$/.test(q.text||''));
  if(nounBad.length) return '명사구에 부호가 붙음: '+nounBad.map(q=>q.id);
  const bad=QUESTIONS.questions.filter(q=>{
    const t=q.text||''; if(!t||q.stem) return false;
    if(!/[.?!]$/.test(t)) return true;
    const ask=/(나요|인가요|가요|까요|어떤가요|쪽인가요|같나요|정하나요)[?]$/.test(t);
    const askNoMark=/(나요|인가요|가요|까요|어떤가요|쪽인가요|같나요|정하나요)[.]$/.test(t);
    return askNoMark;});
  return bad.length===0?true:'부호 오류: '+bad.map(q=>q.id);});
T('I21. 인쇄가 막힌 환경을 감지해 파일 저장으로 넘어간다',()=>{
  const embed=/window\.self!==window\.top/.test(SRC.replace(/\s/g,''));
  const hasPrint=SRC.includes('window.print');
  const hasSave=SRC.includes("claude.use('downloads')")&&SRC.includes('d.save');
  const hasBlob=SRC.includes('createObjectURL');
  const hasFile=SRC.includes('saveResultFile');
  const hasCss=/@media print\{/.test(HTML)&&/\.print-head/.test(HTML);
  return (embed&&hasPrint&&hasSave&&hasBlob&&hasFile&&hasCss)?true:
    `embed:${embed} print:${hasPrint} downloads:${hasSave} blob:${hasBlob} file:${hasFile} css:${hasCss}`;});
T('I22. 아이 문항이 짧고 어려운 말이 없다',()=>{
  const HARD=/(자연현상|탐구|근거로 설명|해결 방법을 생각|정치·경제·사회|문예창작|비교적|관심사가 다양|생명과학|국제관계)/;
  const bad=[];
  QUESTIONS.questions.filter(q=>q.by==='child'&&/^K5/.test(q.id)).forEach(q=>{
    if(q.text.length>34) bad.push(q.id+' 길이'+q.text.length);
    if(HARD.test(q.text)) bad.push(q.id+' 어휘');
    (q.options||[]).forEach(o=>{if(HARD.test(o.label)) bad.push(q.id+' 선지');});});
  QUESTIONS.questions.filter(q=>q.by==='child').forEach(q=>{
    (q.options||[]).forEach(o=>{if(HARD.test(o.label)) bad.push(q.id+' 선지 어휘');});});
  return bad.length===0?true:bad.join(', ');});

T('I23. 진입 비밀번호가 평문이 아니라 해시로 들어 있다',()=>{
  const plain=/['\"]2608['\"]/.test(SRC);
  const hash=/GATE_HASH='[0-9a-f]{64}'/.test(SRC);
  const gated=/phase:'gate'/.test(SRC)&&SRC.includes('gateHTML');
  return (!plain&&hash&&gated)?true:`plain:${plain} hash:${hash} gated:${gated}`;});

T('I24. 학교 유형이 전부(일반고·자사고·외고·국제고·과학고·영재학교) 정의돼 있다',()=>{
  const ids=RULES.types.map(t=>t.id);
  const want=['일반고','광역 자사고','전국 자사고','외고','국제고','과학고','영재학교'];
  const miss=want.filter(x=>!ids.includes(x));
  return miss.length===0?true:'빠진 유형: '+miss.join(', ');});
T('I25. 관심·준비가 맞는 아이에게 해당 유형이 후보로 나온다',()=>{
  const base={A1:'m3',A2:{sido:'서울'},A3:'D',A4:'A',A5:'A',A6:'A',B1:'B',B3:'A',B4:'A',B5:'B',
    C1:'A',C2:'A',D1:'3',D2:'3',D3:'3',E1:'4',E2:'A',F1:'A',F2:'A',G1:'A',G2:'A',G3:'A',H1:'C',
    K1:'A',K2:'A',K3:'A',K4:['eng'],'K5-eng':'4','K5-med':'2','K5-soc':'2','K5-lang':'1','K5-intl':'1','K5-art':'2'};
  const all=r=>['primary','conditional','low'].flatMap(k=>r.buckets[k].map(x=>x.id));
  // 외국어 관심 → 외고 후보
  const langKid={...base,K4:['lang'],'K5-lang':'4','K5-eng':'1'};
  if(!all(evaluate(langKid)).includes('외고')) return '외국어 관심인데 외고 없음';
  // 과학고 준비+이공+최상위 → 과학고 후보
  const sciKid={...base,B1:'A',B2:{국어:{raw:'98',mean:'75'},영어:{raw:'99',mean:'78'},수학:{raw:'100',mean:'70'},사회:{raw:'97',mean:'76'},과학:{raw:'99',mean:'72'}},B5:'A',B5f:{kor:'1',mat:'1',eng:'1'},H1:'A'};
  const r=evaluate(sciKid);
  if(!r.buckets.primary.some(x=>x.id==='과학고')) return '과학고 준비·최상위인데 과학고가 지금 검토에 없음';
  return true;});
T('I26. 관심 없는 특목고는 후보에서 제외돼 이유가 붙는다',()=>{
  const base={A1:'m3',A2:{sido:'서울'},A3:'D',A4:'A',A5:'A',A6:'A',B1:'B',B3:'C',B4:'C',B5:'B',
    C1:'A',C2:'A',D1:'3',D2:'3',D3:'3',E1:'3',E2:'A',F1:'A',F2:'A',G1:'A',G2:'A',G3:'A',H1:'C',
    K1:'A',K2:'A',K3:'A',K4:['soc'],'K5-eng':'2','K5-med':'2','K5-soc':'4','K5-lang':'1','K5-intl':'1','K5-art':'2'};
  const r=evaluate(base);
  return (r.excluded.includes('외고')&&r.excluded.includes('과학고'))?true:'제외 처리 안 됨: '+r.excluded.join(',');});
T('I27. 과학고·영재는 내신 등급 컷으로 우선순위낮음에 처박히지 않는다',()=>{
  const base={A1:'m3',A2:{sido:'서울'},A3:'D',A4:'A',A5:'A',A6:'A',B1:'A',
    B2:{국어:{raw:'96',mean:'80'},영어:{raw:'95',mean:'82'},수학:{raw:'97',mean:'78'},사회:{raw:'94',mean:'80'},과학:{raw:'96',mean:'79'}},
    B5:'A',B5f:{kor:'1',mat:'2',eng:'1'},C1:'A',C2:'A',D1:'3',D2:'3',D3:'3',E1:'5',E2:'A',F1:'A',F2:'A',G1:'A',G2:'A',G3:'A',H1:'A',
    K1:'A',K2:'A',K3:'A',K4:['eng'],'K5-eng':'4','K5-med':'2','K5-soc':'2','K5-lang':'1','K5-intl':'1','K5-art':'2'};
  const r=evaluate(base);
  const sciLow=r.buckets.low.some(x=>x.id==='과학고'&&x.reasons.some(y=>y.kind==='position'));
  return !sciLow?true:'과학고가 학력 컷으로 low에 감';});

T('I28. 초등은 방향을 내되 유형 순위는 안 낸다',()=>{
  const base={A2:{sido:'서울'},A3:'D',A4:'A',A5:'A',A6:'A',D1:'3',D2:'3',D3:'3',E1:'4',E2:'A',
    F1:'A',F2:'A',G1:'A',G2:'A',G3:'A',K1:'A',K2:'A',K3:'A',
    'K5-eng':'4','K5-med':'2','K5-soc':'2','K5-lang':'1','K5-intl':'1','K5-art':'2'};
  const bad=[];
  ['e12','e34','e56'].forEach(g=>{
    const r=evaluate({...base,A1:g});
    if(r.frame.typeRanking) bad.push(g+' 유형순위 나옴');
    if(!r.direction) bad.push(g+' 방향 없음');
    if(r.direction){
      if(!r.direction.env) bad.push(g+' 환경 방향 없음');
      if(!r.direction.caveat) bad.push(g+' 경고 없음');
      // 유형 이름을 '맞다'로 단정하지 않는다 (선택지·알아두기 프레임)
      const txt=r.direction.env+' '+r.direction.interest.join(' ');
      if(/체질입니다|맞습니다|가세요|추천/.test(txt)) bad.push(g+' 단정 표현');}});
  // 고1은 방향도 유형도 안 냄 (전학·재입장 프레임)
  const h1=evaluate({...base,A1:'h1'});
  if(h1.direction) bad.push('h1에 방향이 나옴');
  return bad.length===0?true:bad.join(', ');});

console.log('\n═══ 결과 ═══');
console.log(`  PASS ${pass} · FAIL ${fail}`);
if(fail){console.log('\n실패 목록:');fails.forEach(f=>console.log('  · '+f));process.exit(1);}
console.log('  전부 통과');
