import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Book } from "./useBooks";

export interface ChatConversation {
    id: string;
    user_id: string;
    book_id: string | null;
    title: string | null;
    created_at: string;
    updated_at: string;
    books?: Book | null; // Joined book data
}

export function useConversations() {
    return useQuery({
        queryKey: ["chat_conversations"],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) throw new Error("Not logged in");

            const { data, error } = await supabase
                .from("chat_conversations")
                .select('*, books(*)')
                .eq('user_id', session.user.id)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error("Error fetching conversations:", error);
                throw error;
            }
            return data as ChatConversation[];
        }
    });
}

export function useDeleteConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("chat_conversations")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chat_conversations"] });
        }
    });
}
