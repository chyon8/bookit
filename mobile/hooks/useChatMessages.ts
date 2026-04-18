import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface ChatMessage {
    id: string;
    conversation_id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

export function useChatMessages(conversationId: string | null) {
    return useQuery({
        queryKey: ["chat_messages", conversationId],
        queryFn: async () => {
            if (!conversationId) return [];

            const { data, error } = await supabase
                .from("chat_messages")
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true }); 

            if (error) {
                console.error("Error fetching messages:", error);
                throw error;
            }
            return data as ChatMessage[];
        },
        enabled: !!conversationId
    });
}
