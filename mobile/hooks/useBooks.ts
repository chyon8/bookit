import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export enum ReadingStatus {
  Reading = "Reading",
  Finished = "Finished",
  Dropped = "Dropped",
  WantToRead = "Want to Read",
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url: string;
  description: string;
  isbn13: string;
  category?: string;
}

export interface MemorableQuote {
  quote: string;
  page: string;
  thought: string;
  date?: string;
}

export interface Memo {
    text: string;
    createdAt: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  books: Book;
  status: ReadingStatus | null;
  rating: number | null;
  start_date: string | null;
  end_date: string | null;
  one_line_review: string | null;
  memos: Memo[] | null;
  memorable_quotes: MemorableQuote[] | null;
  overall_impression: string | null;
  connected_thoughts: string | null;
  questions_from_book: string[] | null;
  reread_will: boolean | null;
}

export interface BookWithReview {
    id: string;
    title: string;
    author: string;
    coverImageUrl: string;
    description: string;
    isbn13: string;
    category?: string;
    review: UserBook;
    searchable_content?: string;
}

export function useBooks() {

  return useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_books")
        .select(`
          id,
          book_id,
          user_id,
          status,
          rating,
          start_date,
          end_date,
          one_line_review,
          memos,
          memorable_quotes,
          overall_impression,
          connected_thoughts,
          questions_from_book,
          reread_will,
          books (
            id,
            title,
            author,
            cover_image_url,
            description,
            isbn13,
            category
          )
        `)
        .order("created_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching books:", error);
        throw error;
      }


      return data as unknown as UserBook[];
    },
  });
}
