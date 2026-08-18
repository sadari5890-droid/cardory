# Cardory

브랜드 페르소나와 주제를 입력하면 기획, 이미지, 한글 타이포그래피가 결합된 카드뉴스를 제작하는 웹 스튜디오입니다.

## 주요 기능

- `gpt-image-2` 기반 글자 없는 카드 배경 이미지 생성
- 업로드 사진을 4면 캐릭터 시트로 변환하고 전 카드의 얼굴·의상·스타일 일관성 유지
- 카드별 제목, 본문, 이미지 프롬프트, 순서, 정렬, 색상, 오버레이 편집
- Canvas 기반 정확한 한글 합성 및 고해상도 PNG 다운로드
- Supabase 이메일 OTP 로그인과 사용자별 생성 기록 저장(RLS)

## 환경 변수

`.env.example`을 `.env.local`로 복사하고 다음 값을 설정합니다.

```env
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 실행

```bash
pnpm install
pnpm dev
```

Supabase 프로젝트의 SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql)을 실행해 테이블과 RLS 정책을 생성하세요.

## 기술 스택

Next.js 16, React 19, OpenAI API (`gpt-image-2`), Supabase Auth/Postgres, TypeScript
