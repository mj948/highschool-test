/* 최소 DOM 스텁으로 전 학년 경로를 끝까지 눌러 본다 */
import fs from 'fs';
const HTML=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const SRC=HTML.match(/<script>\n([\s\S]*)<\/script>/)[1];
const GRADE=process.argv[2]?+process.argv[2]:0;
let OUT='',els={},coll={},store={};
const mk=()=>({onclick:null,oninput:null,onchange:null,onkeydown:null,dataset:{},value:'',
  disabled:false,classList:{add(){},remove(){},toggle(){}},querySelectorAll:()=>[],style:{},scrollIntoView(){}});
function scan(v){ els={};coll={};
  [...v.matchAll(/id="([^"]+)"([^>]*)>/g)].forEach(m=>{const e=mk(); if(/disabled/.test(m[2])) e.disabled=true; els['#'+m[1]]=e;});
  coll['.opt']=[...v.matchAll(/class="opt[^"]*" data-v="([^"]+)"/g)].map(m=>{const e=mk();e.dataset.v=m[1];return e;});
  coll['.grid input[data-r]']=[...v.matchAll(/data-r="([^"]+)" data-c="([^"]+)"/g)].map(m=>{const e=mk();e.dataset.r=m[1];e.dataset.c=m[2];return e;});
  coll['.grid input[data-g]']=[...v.matchAll(/data-g="([^"]+)"/g)].map(m=>{const e=mk();e.dataset.g=m[1];return e;});}
const APPEL={set innerHTML(v){OUT=v;scan(v);},get innerHTML(){return OUT;},querySelectorAll(s){return coll[s]||[]}};
globalThis.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}};
globalThis.window={scrollTo(){},print(){}};
globalThis.confirm=()=>true; globalThis.prompt=()=>null; globalThis.alert=()=>{};
globalThis.setTimeout=f=>{f();return 0}; globalThis.fetch=()=>Promise.resolve({ok:true});
globalThis.crypto={subtle:{digest:async(_,buf)=>{
  const c=require('crypto');const h=c.createHash('sha256').update(Buffer.from(buf)).digest();
  return h.buffer.slice(h.byteOffset,h.byteOffset+h.byteLength);}}};
globalThis.TextEncoder=require('util').TextEncoder;
globalThis.Blob=class{constructor(){}}; globalThis.URL={createObjectURL:()=>'',revokeObjectURL(){}};
globalThis.document={querySelector:s=>s==='#app'?APPEL:(els[s]||null),
  getElementById:id=>id==='app'?APPEL:(els['#'+id]||mk()),
  createElement:()=>mk(), body:{appendChild(){}}};
new Function(SRC.replace(/document\.getElementById\('admBtn'\)\.onclick=adminOpen;/,''))();
const press=id=>{const e=els['#'+id]; if(!e) throw new Error('버튼 없음 '+id); e.onclick();};
let steps=0, seen=[];
(async()=>{
press('start');
for(let g=0; g<400; g++){
  steps++;
  const cur=(OUT.match(/class="bar-ax[^"]*">([^<]+)</)||[])[1]||'';
  if(seen[seen.length-1]!==cur&&cur) seen.push(cur);
  if(els['#go2']){press('go2');continue;}
  if(els['#skip2']){press('skip2');continue;}
  if(els['#again2']) break;
  if(els['#sido']){els['#sido'].value='서울';els['#sido'].onchange();}
  const gi=coll['.grid input[data-r]']||[]; if(gi.length) gi.forEach(e=>{e.value=e.dataset.c==='raw'?'94':'78';e.oninput();});
  const gg=coll['.grid input[data-g]']||[]; if(gg.length) gg.forEach(e=>{e.value='4';e.oninput();});
  if(els['#ta']&&els['#ta'].oninput){els['#ta'].value='';els['#ta'].oninput();}
  const opts=coll['.opt']||[];
  if(opts.length&&(!els['#go']||els['#go'].disabled)){(steps===1?opts[Math.min(GRADE,opts.length-1)]:opts[0]).onclick();continue;}
  if(els['#go']){press('go');continue;}
  if(opts.length){opts[0].onclick();continue;}
  throw new Error('진행 불가:\n'+OUT.slice(0,400));
}
const G=['초1·2','초3·4','초5·6','중1','중2','중3','고1'][GRADE]||'?';
console.log(`[${G}] 클릭 ${steps}회 → 결과 도달`);
console.log('  블록:', seen.join(' → '));
const RULES0=JSON.parse(SRC.match(/^const RULES=(\{.*\});$/m)[1]);
const gid=['e12','e34','e56','m1','m2','m3','h1'][GRADE];
const title=(RULES0.gradeFrames[gid]||{}).title||'답변에서 확인된 공부 성향';
const want=[title,'아이가 더 관심을 보인 활동','학교별로 반드시 확인할 것','이번 학기에 할 일'];
const miss=want.filter(w=>!OUT.includes(w));
console.log('  결과 구획:', miss.length?('빠짐 '+miss.join(', ')):'전부 있음');
const rank=OUT.includes('세 묶음으로 정리했습니다');
console.log('  유형 순위 표시:', rank?'있음':'없음', (GRADE<=2||GRADE===6)?(rank?'  ← ⚠ 초등·고1인데 순위가 나옴':'  ← 정상'):(rank?'  ← 정상':'  ← ⚠ 중등인데 순위가 없음'));
const RULES=JSON.parse(SRC.match(/^const RULES=(\{.*\});$/m)[1]);
const leak=RULES.outputPolicy.bannedWords.filter(w=>OUT.includes(w));
console.log('  결과 화면 금지어:', leak.length?leak.join(', '):'없음');
})();
