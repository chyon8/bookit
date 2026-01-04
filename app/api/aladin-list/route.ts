import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";




export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryType = searchParams.get("queryType") || "ItemNewSpecial";
  const categoryId = searchParams.get("categoryId") || "1"; // Default to 1 (Domestic Books) if not specified, as EditorChoice often needs it.
  


  const apiKey = process.env.NEXT_PUBLIC_ALADIN_API_KEY;
  if (!apiKey) {
    console.error("알라딘 API 키가 설정되지 않았습니다.");
    return NextResponse.json(
      { error: "서버 설정 오류: API 키가 없습니다." },
      { status: 500 }
    );
  }

  // Aladin ItemList API URL
  const url = `http://www.aladin.co.kr/ttb/api/ItemList.aspx?ttbkey=${apiKey}&QueryType=${queryType}&CategoryId=${categoryId}&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101`;

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
      
      // Support Bearer token for Mobile App
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
      
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser(token);

      if (authError) {
          console.error("[API] List - Auth Error:", authError.message);
      }

      let userBookIsbns = new Set();
      let userBookLegacy = new Set(); 

      const isbnToReviewMap = new Map();
      const legacyToReviewMap = new Map();
      const cleanAuthor = (author: string) => author.replace(/\s*\(.*\)/g, "");

      if (user) {
        const { data: userBooks, error: booksError } = await supabase
          .from("user_books")
          .select("*, books(*)") 
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

      const listResults = data.item.map((item: any) => {
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
          coverImageUrl: item.cover.replace("coversum", "cover200"), // Better quality
          category: item.categoryName.split(">")[1] || item.categoryName,
          isInBookshelf,
          review,
          // Extra fields for curated list
          pubDate: item.pubDate,
          publisher: item.publisher,
          customerReviewRank: item.customerReviewRank,
          bestRank: item.bestRank
        };
      });

      return NextResponse.json({ item: listResults });
    }

    return NextResponse.json(data);
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
