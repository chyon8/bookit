import { NextResponse } from "next/server";



export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isbn = searchParams.get("isbn");

  if (!isbn) {
    return NextResponse.json(
      { error: "ISBN을 입력해주세요." },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_ALADIN_API_KEY;
  if (!apiKey) {
    console.error("알라딘 API 키가 설정되지 않았습니다.");
    return NextResponse.json(
      { error: "서버 설정 오류: API 키가 없습니다." },
      { status: 500 }
    );
  }

  // Determine ID Type
  // ISBN13 is 13 digits.
  // ISBN10 is 10 digits.
  // Aladin ItemId is usually shorter or different.
  let itemIdType = "ItemId";
  if (isbn.length === 13) {
      itemIdType = "ISBN13";
  } else if (isbn.length === 10) {
      itemIdType = "ISBN";
  }

  // Use ItemLookUp API for detailed book information
  const url = `http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${apiKey}&itemIdType=${itemIdType}&ItemId=${isbn}&output=js&Version=20131101&OptResult=ebookList,usedList,reviewList`;



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

    if (data.item && data.item.length > 0) {
      const item = data.item[0];
      const cleanAuthor = (author: string) => author.replace(/\s*\(.*\)/g, "");

      const bookDetail = {
        id: item.isbn13 || item.itemId.toString(),
        isbn13: item.isbn13 || item.itemId.toString(),
        title: item.title,
        author: item.author,
        description: item.description || item.fullDescription || "",
        coverImageUrl: item.cover.replace("coversum", "cover200"),
        category: item.categoryName.split(">")[1] || item.categoryName,
        publisher: item.publisher,
        pubDate: item.pubDate,
        link: item.link,
      };

      return NextResponse.json({ book: bookDetail });
    }

    return NextResponse.json(
      { error: "책 정보를 찾을 수 없습니다." },
      { status: 404 }
    );
  } catch (error: any) {
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
