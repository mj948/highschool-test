# 클라우드 동기화 설정 가이드

이 가이드를 따라 하면 **모든 학생의 응답이 클라우드 한 곳에 모이고, 관리자는 어느 기기에서든 전체 데이터를 조회**할 수 있게 됩니다.

소요 시간: 약 **10분**, 비용: **무료** (Supabase 무료 플랜 — 월 5만 명까지 충분)

---

## 1단계 · Supabase 가입 및 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 접속 → 우측 상단 **Start your project** 클릭
2. GitHub 또는 이메일로 가입
3. 가입 후 대시보드에서 **New project** 클릭
4. 프로젝트 정보 입력:
   - **Name**: 예) `gokyo-test`
   - **Database Password**: 자동 생성된 비밀번호를 그대로 사용해도 OK (메모는 해두세요)
   - **Region**: `Northeast Asia (Seoul)` 선택 — 한국 사용자 응답속도 ↑
   - **Pricing Plan**: `Free` 그대로
5. **Create new project** 클릭 → 프로비저닝에 약 1~2분 소요

---

## 2단계 · 데이터베이스 SQL 실행

1. 프로젝트가 준비되면 좌측 메뉴에서 **SQL Editor** 클릭
2. 우측 상단 **+ New query** 클릭
3. 함께 받은 **`SUPABASE_설정.sql`** 파일을 메모장 등으로 열기
4. 파일 안의 **`YOUR_ADMIN_PASSWORD`** 를 원하는 관리자 비밀번호로 모두 변경
   - 메모장의 "찾기/바꾸기"(Ctrl+H 또는 Cmd+H)로 한 번에 바꾸기 권장
   - 총 **3곳**에 등장합니다. 같은 비밀번호로 모두 바꿔주세요.
   - 추천: 영문+숫자 8자 이상 (예: `ourSchool2026`)
5. 변경한 SQL 전체를 복사 → SQL Editor에 붙여넣기
6. 우측 하단 **Run** 버튼 클릭 (또는 Ctrl/Cmd + Enter)
7. 하단에 `Success. No rows returned` 비슷한 초록 메시지가 뜨면 완료

> **확인**: 좌측 메뉴 **Table Editor** → `responses` 테이블이 보이면 정상.

---

## 3단계 · API 키 복사

1. 좌측 메뉴 맨 아래 **⚙️ Project Settings** 클릭
2. **API** 메뉴 선택
3. 두 가지 값을 메모해 둡니다:
   - **Project URL**: `https://abcdxxxxxx.supabase.co` 형태
   - **Project API Keys → anon public**: `eyJhbGciOi...` 로 시작하는 매우 긴 문자열
   - ⚠️ `service_role` 키는 **절대 사용하지 마세요** (관리자 권한 키)

---

## 4단계 · HTML 파일에 키 입력

1. `index.html` 파일을 메모장이나 VSCode 같은 편집기로 열기
2. 파일 위쪽에서 다음 두 줄을 찾기 (대략 990번째 줄 근처):

```js
const SUPABASE_URL = "";       // 예: "https://abcdxyz.supabase.co"
const SUPABASE_ANON_KEY = "";  // anon public 키 (긴 문자열)
```

3. 따옴표 안에 3단계에서 복사한 값을 붙여넣기:

```js
const SUPABASE_URL = "https://abcdxxxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

4. 저장

---

## 5단계 · 다시 발행

1. [https://app.netlify.com/drop](https://app.netlify.com/drop) 접속
2. 수정한 `index.html` 을 다시 드래그&드롭
3. 새 URL 발급 또는 기존 사이트에 덮어쓰기

> **기존 Netlify 사이트에 덮어쓰기**: 처음에 Netlify Drop을 가입 없이 썼다면, 이메일을 등록해 사이트를 영구화한 뒤 → Site overview → Deploys 페이지에서 새 zip/파일을 끌어다 놓으면 같은 URL에 업데이트됩니다.

---

## 6단계 · 동작 확인

1. 발행된 URL을 본인 휴대폰(또는 다른 브라우저)에서 열기
2. 검사를 끝까지 진행 → 결과 화면 표시
3. 다른 기기 / PC 에서 같은 URL → "관리자" 버튼 → 정한 비밀번호 입력
4. **방금 휴대폰에서 한 응답이 보이면 ✓ 성공**
5. 관리자 페이지 상단에 **☁️ 클라우드 동기화** 배지가 떠야 정상

---

## 일상 운영 팁

- **새 응답 즉시 보기**: 관리자 페이지 우측 상단 **↻ 새로고침** 버튼.
- **비밀번호 변경**: `SUPABASE_설정.sql`에서 새 비밀번호로 바꾼 뒤 SQL Editor에 다시 실행. 3개 함수가 한 번에 갱신됩니다.
- **데이터 백업**: 관리자 페이지의 **JSON 내보내기** 또는 **CSV 내보내기** 정기적으로.
- **데이터 초기화**: 관리자 페이지의 **전체 삭제** (클라우드 + 로컬 모두 비웁니다).
- **요금 걱정**: Supabase 무료 플랜은 DB 500MB, 월 50,000 활성 사용자, 월 5GB 대역폭. 학교/학원 단위에서는 절대 초과될 수 없습니다.

---

## 문제 해결

**"클라우드 연결 실패" 배지가 뜬다**
→ HTML 파일의 `SUPABASE_URL`/`SUPABASE_ANON_KEY` 값이 정확한지 확인. 따옴표 누락, 줄바꿈 끼임 등 점검.

**"Unauthorized" 오류**
→ HTML에 입력한 비밀번호와 SQL에 입력한 `YOUR_ADMIN_PASSWORD` 가 일치하지 않음. SQL을 다시 실행해서 맞춰주세요.

**관리자에 응답이 0개로 보임**
→ 학생이 응답할 때 클라우드 저장이 실패했을 수 있음. 학생의 브라우저 콘솔(F12 → Console)에서 `[Cloud] 저장 실패` 메시지 확인.

**Supabase 무료 한도 초과 안내가 왔다**
→ 거의 일어날 수 없지만, Settings → Billing에서 사용량 확인. 보통 너무 많은 응답이 누적된 경우인데, 오래된 데이터를 백업 후 삭제하면 됩니다.
