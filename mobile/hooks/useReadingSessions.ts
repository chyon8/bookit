import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ReadingStatus } from "./useBooks";

export interface ReadingSession {
  id: string;
  user_book_id: string;
  session_number: number;
  start_date: string | null;
  end_date: string | null;
  rating: number | null;
  status: ReadingStatus | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch all reading sessions for a specific user book
 */
export function useReadingSessions(userBookId: string) {
  return useQuery({
    queryKey: ["reading_sessions", userBookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_sessions")
        .select("*")
        .eq("user_book_id", userBookId)
        .order("session_number", { ascending: false }); // Most recent first

      if (error) {
        console.error("Error fetching reading sessions:", error);
        throw error;
      }

      return data as ReadingSession[];
    },
    enabled: !!userBookId,
  });
}

/**
 * Hook to create a new reading session
 */
export function useCreateReadingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userBookId,
      sessionNumber,
      startDate,
      endDate,
      rating,
      status,
    }: {
      userBookId: string;
      sessionNumber: number;
      startDate: string | null;
      endDate: string | null;
      rating: number | null;
      status: ReadingStatus | null;
    }) => {
      const { data, error } = await supabase
        .from("reading_sessions")
        .insert({
          user_book_id: userBookId,
          session_number: sessionNumber,
          start_date: startDate,
          end_date: endDate,
          rating: rating,
          status: status,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating reading session:", error);
        throw error;
      }

      return data as ReadingSession;
    },
    onSuccess: (_, variables) => {
      // Invalidate sessions query to refetch
      queryClient.invalidateQueries({
        queryKey: ["reading_sessions", variables.userBookId],
      });
    },
  });
}
