import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "검색어를 입력해주세요." },
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

    if (data.item) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let userBookIsbns = new Set();
      let userBookLegacy = new Set(); // For books without isbn13

      const isbnToReviewMap = new Map();
      const legacyToReviewMap = new Map();
      const cleanAuthor = (author) => author.replace(/\s*\(.*\)/g, "");

      if (user) {
        const { data: userBooks, error: booksError } = await supabase
          .from("user_books")
          .select("*, books(*)") // Fetch all columns
          .eq("user_id", user.id);

        if (booksError) {
          console.error("Supabase error:", booksError);
        } else if (userBooks) {
          userBooks.forEach((userBook) => {
            const { books, ...reviewData } = userBook;
            if (books && books.isbn13) {
              isbnToReviewMap.set(books.isbn13, reviewData);
            } else if (books) {
              legacyToReviewMap.set(
                `${books.title}|${cleanAuthor(books.author)}`,
                reviewData
              );
            }
          });
        }
      }

      const searchResults = data.item.map((item) => {
        const authorName = cleanAuthor(item.author);
        const legacyKey = `${item.title}|${authorName}`;

        const review =
          isbnToReviewMap.get(item.isbn13) ||
          legacyToReviewMap.get(legacyKey) ||
          null;
        const isInBookshelf = !!review;

        return {
          id: item.isbn13 || item.itemId.toString(),
          isbn13: item.isbn13 || item.itemId.toString(),
          title: item.title,
          author: item.author,
          description: item.description,
          coverImageUrl: item.cover.replace("coversum", "cover200"),
          category: item.categoryName.split(">")[1] || item.categoryName,
          isInBookshelf,
          review,
        };
      });

      return NextResponse.json({ item: searchResults });
    }

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
