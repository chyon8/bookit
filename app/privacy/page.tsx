import React from "react";

export const metadata = {
  title: "개인정보처리방침 - Bookit",
  description: "Bookit 앱 개인정보처리방침",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-light-gray dark:bg-dark-bg py-16 px-4">
      <div className="max-w-3xl mx-auto bg-card dark:bg-dark-card rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-3xl font-bold text-text-heading dark:text-dark-text-heading mb-2">
          개인정보처리방침
        </h1>
        <p className="text-text-muted mb-8">최종 수정일: 2026년 3월 9일</p>

        <div className="space-y-8 text-text-body dark:text-dark-text-body leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-text-heading dark:text-dark-text-heading mb-3">
              1. 개요
            </h2>
            <p>
              Bookit(이하 &quot;서비스&quot;)은 사용자의 개인정보를 중요하게
              생각하며, 개인정보 보호법에 따라 사용자의 개인정보를 보호하고
              이에 관한 고충을 원활하게 처리할 수 있도록 다음과 같은
              처리방침을 두고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-heading dark:text-dark-text-heading mb-3">
              2. 수집하는 개인정보 항목
            </h2>
            <p className="mb-2">서비스는 다음과 같은 개인정보를 수집합니다:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>계정 정보:</strong> 이메일 주소, 이름 (Google 로그인
                시 프로필 정보)
              </li>
              <li>
                <strong>독서 기록:</strong> 등록한 도서 정보, 독서 상태, 평점,
                시작일/종료일
              </li>
              <li>
                <strong>사용자 작성 콘텐츠:</strong> 한줄평, 독서 감상,
                메모, 인상 깊은 구절
              </li>
              <li>
                <strong>촬영 이미지:</strong> OCR 기능 사용 시 촬영한 사진
                (텍스트 추출 후 원본 이미지는 저장하지 않음)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-heading dark:text-dark-text-heading mb-3">
              3. 개인정보 수집 및 이용 목적
            </h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>회원 가입 및 로그인 인증</li>
              <li>독서 기록 저장 및 관리</li>
              <li>AI 기반 독서 분석 및 추천 서비스 제공</li>
              <li>OCR을 통한 텍스트 인식 서비스 제공</li>
              <li>서비스 개선 및 사용자 경험 향상</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-heading dark:text-dark-text-heading mb-3">
              4. 개인정보 보관 및 저장
            </h2>
            <p>
              사용자의 데이터는{" "}
              <strong>Supabase (PostgreSQL)</strong> 클라우드 데이터베이스에
              안전하게 저장됩니다. 데이터는 암호화된 연결(TLS)을 통해
              전송되며, 접근 권한이 제어됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-heading dark:text-dark-text-heading mb-3">
              5. 제3자 제공
            </h2>
            <p className="mb-2">
              서비스는 다음의 경우에 한해 사용자 데이터를 제3자 서비스에
              전달합니다:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Google Gemini AI:</strong> AI 챗봇 기능 사용 시
                독서 기록 데이터가 분석을 위해 전달됩니다.
              </li>
              <li>
                <strong>Google Cloud Vision API:</strong> OCR 기능 사용 시
                촬영한 이미지가 텍스트 인식을 위해 전달됩니다.
              </li>
              <li>
                <strong>알라딘 API:</strong> 도서 검색 시 검색어가 도서
                정보 조회를 위해 전달됩니다.
              </li>
            </ul>
            <p className="mt-2">
              상기 서비스 외에 사용자의 개인정보를 제3자에게 판매, 대여
              또는 공유하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-heading dark:text-dark-text-heading mb-3">
              6. 사용자 권리 및 데이터 삭제
            </h2>
            <p>사용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>등록한 독서 기록 및 메모의 열람, 수정, 삭제</li>
              <li>계정 삭제 요청 (모든 관련 데이터가 함께 삭제됩니다)</li>
            </ul>
            <p className="mt-2">
              계정 삭제를 원하시는 경우, 앱 내 설정에서 직접 삭제하거나
              아래 연락처로 요청해 주세요.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-heading dark:text-dark-text-heading mb-3">
              7. 연락처
            </h2>
            <p>
              개인정보 처리에 관한 문의사항이 있으시면 아래로 연락해 주세요:
            </p>
            <p className="mt-2">
              <strong>이메일:</strong> sangmin030912@gmail.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-heading dark:text-dark-text-heading mb-3">
              8. 방침 변경
            </h2>
            <p>
              본 개인정보처리방침은 법령 또는 서비스 변경에 따라 수정될 수
              있으며, 변경 시 본 페이지를 통해 공지합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
