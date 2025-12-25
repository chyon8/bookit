import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../utils/supabase/client";
import { BookWithReview, UserBook, Memo } from "../types";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

// Helper function to process memos
const processMemos = (memosArray: any[] | undefined): Memo[] => {
  if (!memosArray) return [];
  return memosArray
    .map((m) => {
      if (typeof m === "string") {
        return { text: m, createdAt: new Date().toISOString() };
      }
      if (typeof m === "object" && m !== null) {
        if (
          "text" in m &&
          typeof (m as any).text === "string" &&
          "createdAt" in m &&
          typeof (m as any).createdAt === "string"
        ) {
          return m as Memo;
        }
        if ("text" in m && typeof (m as any).text === "string") {
          console.warn(
            "Malformed memo object found (missing createdAt), providing default:",
            m
          );
          return { text: (m as any).text, createdAt: new Date().toISOString() };
        }
      }
      console.warn("Unexpected memo format, returning empty memo:", m);
      return null;
    })
    .filter((m): m is Memo => m !== null);
};

// Query key factory
export const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (userId: string) => [...bookKeys.lists(), userId] as const,
  details: () => [...bookKeys.all, "detail"] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
};

// Fetch all user books
export function useUserBooks(user: User | null) {
  return useQuery({
    queryKey: bookKeys.list(user?.id || ""),
    queryFn: async (): Promise<BookWithReview[]> => {
      if (!user) return [];

      const { data: userBooks, error } = await supabase
        .from("user_books")
        .select(`*, books (*)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user books:", error);
        throw error;
      }

      if (!userBooks) return [];

      const formattedBooks: BookWithReview[] = userBooks.map((ub: any) => {
        const { books: bookData, ...reviewData } = ub;

        const normalizedMemos = processMemos(reviewData.memos);

        // Create the searchable content string
        const searchable_content = [
          bookData.title,
          bookData.author,
          reviewData.one_line_review,
          ...normalizedMemos.map((memo) => memo.text),
          ...((reviewData.memorable_quotes as any[]) || []).flatMap(
            (q: any) => [q.quote, q.thought]
          ),
          ...(reviewData.questions_from_book || []),
          reviewData.connected_thoughts,
          reviewData.overall_impression,
          reviewData.reread_reason,
          reviewData.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return {
          id: bookData.id,
          isbn13: bookData.isbn13,
          title: bookData.title,
          author: bookData.author,
          category: bookData.category,
          description: bookData.description,
          coverImageUrl: bookData.cover_image_url,
          review: { ...reviewData, memos: normalizedMemos } as UserBook,
          searchable_content,
        };
      });

      return formattedBooks;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch a single book by ID
export function useBookData(bookId: string | null, user: User | null) {
  return useQuery({
    queryKey: bookKeys.detail(bookId || ""),
    queryFn: async (): Promise<BookWithReview | null> => {
      if (!user || !bookId) return null;

      const { data, error } = await supabase
        .from("user_books")
        .select(`*, books(*)`)
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching book:", error);
        throw error;
      }

      if (!data) return null;

      const { books: dbBookData, ...reviewData } = data;
      const formattedBook: BookWithReview = {
        id: dbBookData.id,
        isbn13: dbBookData.isbn13,
        title: dbBookData.title,
        author: dbBookData.author,
        category: dbBookData.category,
        description: dbBookData.description,
        coverImageUrl: dbBookData.cover_image_url,
        review: {
          ...reviewData,
          memos: processMemos(reviewData.memos),
        } as UserBook,
      };

      return formattedBook;
    },
    enabled: !!user && !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation for updating book review
export function useUpdateBookReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      reviewData,
    }: {
      reviewId: string;
      reviewData: Partial<UserBook>;
    }) => {
      const { error } = await supabase
        .from("user_books")
        .update(reviewData)
        .eq("id", reviewId);

      if (error) throw error;

      return reviewData;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.details() });
    },
  });
}
