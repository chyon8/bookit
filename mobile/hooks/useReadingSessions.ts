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

/**
 * Hook to update an existing reading session
 */
export function useUpdateReadingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      userBookId,
      updates,
    }: {
      sessionId: string;
      userBookId: string;
      updates: Partial<ReadingSession>;
    }) => {
      const { data, error } = await supabase
        .from("reading_sessions")
        .update(updates)
        .eq("id", sessionId)
        .select()
        .single();

      if (error) {
        console.error("Error updating reading session:", error);
        throw error;
      }

      return data as ReadingSession;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reading_sessions", variables.userBookId],
      });
    },
  });
}

/**
 * Hook to delete a reading session and reorder remaining sessions
 */
export function useDeleteReadingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      userBookId,
      sessionNumber,
    }: {
      sessionId: string;
      userBookId: string;
      sessionNumber: number;
    }) => {
      // 1. Delete the session
      const { error: deleteError } = await supabase
        .from("reading_sessions")
        .delete()
        .eq("id", sessionId);

      if (deleteError) {
        console.error("Error deleting reading session:", deleteError);
        throw deleteError;
      }

      // 2. Reorder remaining sessions (decrease session_number for all sessions after the deleted one)
      const { data: sessionsToUpdate, error: fetchError } = await supabase
        .from("reading_sessions")
        .select("id, session_number")
        .eq("user_book_id", userBookId)
        .gt("session_number", sessionNumber);

      if (fetchError) {
        console.error("Error fetching sessions to reorder:", fetchError);
        throw fetchError;
      }

      // Update each session's session_number
      if (sessionsToUpdate && sessionsToUpdate.length > 0) {
        for (const session of sessionsToUpdate) {
          const { error: updateError } = await supabase
            .from("reading_sessions")
            .update({ session_number: session.session_number - 1 })
            .eq("id", session.id);

          if (updateError) {
            console.error("Error reordering session:", updateError);
            throw updateError;
          }
        }
      }

      return sessionId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reading_sessions", variables.userBookId],
      });
    },
  });
}
