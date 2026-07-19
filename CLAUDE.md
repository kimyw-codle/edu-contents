# edu-contents

개인 웹 프로젝트 모음 레포. 하나의 Next.js 앱 안에 여러 페이지로 관리.

## 구조

```
edu-contents/
├── app/                 ← 페이지들 (폴더 = URL 경로)
│   ├── layout.tsx       ← 전체 레이아웃
│   ├── page.tsx         ← 메인 페이지 (/)
│   ├── project-a/
│   │   └── page.tsx     ← /project-a
│   └── project-b/
│       └── page.tsx     ← /project-b
├── docs/                ← 스크립트, 기획 문서
├── components/          ← 공통 UI 컴포넌트
├── public/              ← 이미지 등 정적 파일
└── package.json
```

## 기술 스택

- **프레임워크**: Next.js (App Router)
- **스타일**: Tailwind CSS
- **배포**: Vercel

## 개발

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 빌드
```
