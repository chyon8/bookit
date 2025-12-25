import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase"; // Adjusted import for mobile
import { BookWithReview, UserBook, Memo } from "./useBooks"; // reusing types from useBooks if compatible, or redefining
import { Session } from "@supabase/supabase-js";

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

// Fetch a single book by ID
export function useBookData(bookId: string | null, userId: string | undefined) {
  return useQuery({
    queryKey: bookKeys.detail(bookId || ""),
    queryFn: async (): Promise<BookWithReview | null> => {
      if (!userId || !bookId) return null;

      const { data, error } = await supabase
        .from("user_books")
        .select(`*, books(*)`)
        .eq("book_id", bookId)
        .eq("user_id", userId)
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
    enabled: !!userId && !!bookId,
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
      console.log('Updating review:', reviewId, reviewData);
      
      const { error } = await supabase
        .from("user_books")
        .update(reviewData)
        .eq("id", reviewId);

      if (error) {
        console.error("Error updating review:", error);
        throw error;
      };

      return reviewData;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.details() });
    },
  });
}
