import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "검색어를 입력해주세요." },
      { status: 400 }
    );
  }

  // .env.local 파일에 설정한 API 키를 가져옵니다.
  const apiKey = process.env.NEXT_PUBLIC_ALADIN_API_KEY;

  if (!apiKey) {
    console.error("알라딘 API 키가 설정되지 않았습니다.");
    return NextResponse.json(
      { error: "서버 설정 오류: API 키가 없습니다." },
      { status: 500 }
    );
  }

  // 알라딘 상품 검색 API URL
  const url = `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${apiKey}&Query=${encodeURIComponent(
    query
  )}&QueryType=Keyword&MaxResults=20&start=1&SearchTarget=Book&output=js&Version=20131101`;

  try {
    const aladinResponse = await fetch(url);
    if (!aladinResponse.ok) {
      const errorText = await aladinResponse.text();
      console.error("Aladin API error:", errorText);
      throw new Error(
        `알라딘 API 요청에 실패했습니다: ${aladinResponse.statusText}`
      );
    }

    const data = await aladinResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("API 라우트 처리 중 오류 발생:", error);
    return NextResponse.json(
      {
        error: "API를 호출하는 동안 오류가 발생했습니다.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
