/* index.html 을 만든다.  실행: node _build/build.mjs
   index.html 을 직접 고치지 말고 _build/ 의 조각과 JSON 을 고친 뒤 다시 만든다. */
import fs from 'fs';
const d=new URL('.',import.meta.url), r=new URL('../',import.meta.url);
const rd=(b,p)=>fs.readFileSync(new URL(p,b),'utf8');
const Q=rd(r,'QUESTIONS.json'), R=rd(r,'RULES.json');
const css=rd(d,'css.txt');
const js=['engine.js','ui.js','screens.js','store.js'].map(f=>rd(d,f)).join('\n');
const html=`<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://ihiuzfufngmbbresizzo.supabase.co; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'">
<title>고교선택검사</title>
<meta name="description" content="아이가 어떤 조건에서 공부가 잘 유지되는지 정리하고, 학교를 비교할 때 확인할 것을 알려 주는 검사입니다.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>${css}</style>
</head><body>
<button class="adm" id="admBtn" title="관리자">관리자</button>
<div class="app" id="app"></div>
<script>
/* 고교선택검사 v3.1 — QUESTIONS.json · RULES.json · SPEC.md 와 일치해야 한다 */
const QUESTIONS=${JSON.stringify(JSON.parse(Q))};
const RULES=${JSON.stringify(JSON.parse(R))};
${js}
document.getElementById('admBtn').onclick=adminOpen;
render();
</script>
</body></html>`;
fs.writeFileSync(new URL('index.html',r),html);
console.log('index.html '+Buffer.byteLength(html)+' bytes');

/* 아티팩트용 — 바깥 문서 껍데기를 뺀 판.
   아티팩트는 doctype·html·head·body를 발행할 때 씌워 주므로 그대로 올리면 껍데기가 겹친다.
   CSP도 아티팩트 쪽이 걸어 주니 우리 meta는 뺀다. 구글 폰트는 아티팩트가 허용하는 유일한 외부 호스트다. */
const art=`<title>고교선택검사</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>${css}</style>
<button class="adm" id="admBtn" title="관리자">관리자</button>
<div class="app" id="app"></div>
<script>
/* 고교선택검사 v3.1 — QUESTIONS.json · RULES.json · SPEC.md 와 일치해야 한다 */
const QUESTIONS=${JSON.stringify(JSON.parse(Q))};
const RULES=${JSON.stringify(JSON.parse(R))};
${js}
document.getElementById('admBtn').onclick=adminOpen;
render();
</script>`;
fs.mkdirSync(new URL('_배포/',r),{recursive:true});
fs.writeFileSync(new URL('_배포/artifact.html',r),art);
console.log('_배포/artifact.html '+Buffer.byteLength(art)+' bytes');
