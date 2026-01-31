# 📚 MyBookTracker (가칭) - 독서 기록 및 AI 어시스턴트 프로젝트 분석


## 1. 프로젝트 개요
사용자의 독서 경험을 디지털로 매끄럽게 연결하고, 단순한 기록을 넘어 **AI를 활용한 능동적인 독서 인사이트**를 제공하는 크로스 플랫폼(Web, Mobile) 애플리케이션입니다.

---

## 2. 핵심 기능 및 문제 해결 (Problem Solving)

### 💡 1. AI 기반 도서 검색 및 데이터 최적화
*   **문제 (Problem)**: 
    *   사용자가 책을 등록할 때 정확한 메타데이터(ISBN, 표지, 저자 등)를 찾기 어렵거나, 검색 결과가 불충분한 경우가 많음.
    *   단순 API 검색 결과는 데이터 파편화가 심함.
*   **해결 (Solution)**: 
    *   **Google Gemini AI**와 **알라딘(Aladin) API**를 하이브리드로 활용.
    *   단순 키워드 매칭을 넘어 사용자의 의도를 파악해 "실제 존재하는 책"을 찾아내고, 부족한 정보를 AI가 보완하여 정제된 데이터 포맷(Clean Schema)으로 제공.
*   **기술적 가치**: 외부 데이터 의존성을 줄이고 데이터 정합성을 높임.

### 📸 2. 아날로그 독서 경험을 잇는 'OCR 문장 수집기' (Mobile)
*   **문제 (Problem)**: 
    *   종이책을 읽다가 마음에 드는 문장을 발견했을 때, 모바일로 일일이 타이핑하여 기록하는 것은 경험을 끊는 큰 장벽(Friction)임.
*   **해결 (Solution)**: 
    *   **모바일 최적화 OCR(광학 문자 인식) 워크플로우** 구현.
    *   **UX Flow**: 사진 촬영 -> 이미지 크롭(Image Cropper) -> 텍스트 자동 추출(Tesseract.js) -> 수정 및 등록.
    *   크롭 기능을 통해 불필요한 배경(책상, 손가락 등)을 제거하고 텍스트 인식률을 극대화함.

### 🤖 3. 내 서재와 대화하는 'AI 리터러시 어시스턴트'
*   **문제 (Problem)**: 
    *   책을 많이 읽고 기록해도, 그 데이터가 쌓이기만 할 뿐 "내가 어떤 책을 좋아하는지", "다음엔 뭘 읽어야 할지"에 대한 통찰을 얻기 힘듦.
*   **해결 (Solution)**: 
    *   사용자의 전체 서재 데이터(제목, 평점, 리뷰, 메모 등)를 경량화(Minify)하여 컨텍스트로 주입한 **커스텀 챗봇** 구현.
    *   **기능**: "내 취향 분석해줘(AI Report)", "저번에 읽은 그 책이랑 비슷한 거 추천해줘" 등의 질문에 대해 사용자의 실제 독서 이력을 기반으로 답변.
*   **기획 의도**: 정적인 데이터베이스를 **살아있는 개인화 독서 비서**로 전환.

---

## 3. UX/UI 및 디자인 시스템

### 🎨 Design System: "MyBookTracker"
일관된 사용자 경험을 위해 자체 디자인 시스템을 구축하여 적용했습니다.
*   **Color Palette**: 
    *   Primary (`#FFA500`): 독서의 따뜻함과 활력을 상징하는 오렌지 컬러를 인터랙션 포인트로 사용.
    *   Background (`#F5F5F5`, `#FFFFFF`): 콘텐츠(책 표지, 텍스트)가 돋보이도록 절제된 무채색 배경.
*   **Typography**: 가독성을 최우선으로 한 모던한 산세리프 폰트 시스템 적용.

### 📱 Cross-Platform Experience (User Flow)
*   **Web**: 넓은 화면을 활용한 서재 관리(Drag & Drop 가능성), 상세 리뷰 작성, 통계 대시보드 및 AI 채팅에 최적화.
*   **Mobile**: 이동 중 데이터 열람과 **카메라 기반 액션(OCR)**에 집중하여, 플랫폼별 사용 맥락에 맞는 기능 분배.

---

## 4. 기술 스택 (Tech Stack)
*   **Frontend**: Next.js (Web), React Native / Expo (Mobile), TailwindCSS
*   **Backend & Database**: Supabase (Auth, Postgres DB, Realtime)
*   **AI & Data**: 
    *   **LLM**: Google Gemini (Pro Vision, 1.5 Pro) - 검색 및 챗봇 엔진
    *   **Vision**: Tesseract.js (On-device OCR)
    *   **OpenAPI**: Aladin TTB API
*   **State Management**: React Query (Server State 동기화)

---
*작성일: 2026-01-25 | 분석: AI Agent*
