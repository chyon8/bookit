import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getLLMProvider } from "@/services/llm/provider";
import { ChatMessage } from "@/services/llm/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversationId, bookId, prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    let currentConversationId = conversationId;

    // 1. 대화 세션 확보 (없으면 생성)
    if (!currentConversationId) {
      const title = prompt.slice(0, 20) + (prompt.length > 20 ? "..." : "");
      
      const { data: newConv, error: insertError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          book_id: bookId || null,
          title: title
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      currentConversationId = newConv.id;
    }

    // 2. 현재 상태의 대화 세션 정보 조회 (book_id 등)
    const { data: convData, error: convError } = await supabase
      .from('chat_conversations')
      .select('book_id')
      .eq('id', currentConversationId)
      .single();
      
    if (convError) throw convError;
    const targetBookId = convData?.book_id;

    // 3. 문맥(Context) 구성
    let contextJson = "";
    if (targetBookId) {
      // 책 포커스 모드
      const { data: userBook } = await supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', user.id)
        .eq('book_id', targetBookId)
        .single();

      if (userBook) {
        contextJson = JSON.stringify(userBook, (key, value) => {
           // minify
           if (value === null || value === "" || value?.length === 0) return undefined;
           return value;
        });
      }
    } else {
      // 서재 전체 모드 (최근 기록순 정렬, 읽고 싶은 책 제외)
      const { data: allBooks } = await supabase
        .from('user_books')
        .select('*, books(title, author, category)')
        .eq('user_id', user.id)
        .neq('status', 'Want to Read')
        .order('end_date', { ascending: false, nullsFirst: false });
        
      if (allBooks) {
        const minified = allBooks.map((b: any) => ({
           t: b.books?.title,
           a: b.books?.author,
           c: b.books?.category,
           s: b.status,
           r: b.rating,
           rev: b.one_line_review,
           date: b.end_date || b.start_date || b.created_at
        }));
        contextJson = JSON.stringify(minified);
      }
    }

    // 4. 대화 히스토리 로드 (최신 20개)
    const { data: historyData } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: false })
      .limit(20);
      
    const pastMessages: ChatMessage[] = (historyData || [])
      .reverse()
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    // 5. 프롬프트 조립
    const systemPrompt = targetBookId 
      ? `당신은 "BookIt"의 AI 독서 메이트입니다.
현재 사용자의 특정 책에 대한 기록이 아래 제공됩니다.
[책 기록]
${contextJson}

당신의 역할과 규칙:
1. 사용자의 독서 기록을 참조해 더 깊은 질문을 던지세요.
2. "왜 이 문장이 인상깊었나요?" 같은 생각 정리 질문을 하세요.
3. 책 내용을 가르치려 들기보다, 사용자의 소감을 확장하는 데 집중하세요.
4. 마크다운(**굵게** 등)을 적절히 사용하세요.
5. (중요) 사족을 피하고, 항상 2~3문장 이내로 핵심만 짧고 간결하게 대답하세요.`
      : `당신은 "BookIt"의 AI 독서 메이트입니다.
사용자의 전체 서재 기록이 미니파이된 JSON 포맷으로 제공됩니다. 데이터 배열은 '가장 최근에 읽은 책' 순서(내림차순)로 정렬되어 있습니다.

[전체 서재 기록]
${contextJson}

당신의 역할과 규칙:
1. 여러 책의 기록을 연결해서 사용자도 모르던 패턴이나 최근 관심사를 발견하세요.
2. 답을 내리기보다 질문을 던져 생각을 유도하세요.
3. 사용자가 남긴 한줄평 등 기록을 구체적으로 인용하세요.
4. 마크다운(**굵게** 등)을 적절히 사용하세요.
5. (중요) 사족을 피하고, 항상 2~3문장 이내로 핵심만 짧고 간결하게 대답하세요.`;

    const llmProvider = getLLMProvider();
    
    // 6. 스트리밍 응답 셋업
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // init 이벤트로 새롭게 생성된 conversationId 전달
        const idEvent = `data: ${JSON.stringify({ type: 'init', conversationId: currentConversationId })}\n\n`;
        controller.enqueue(encoder.encode(idEvent));

        let fullAssistantReply = "";

        try {
          const generator = llmProvider.chatStream({
            systemPrompt,
            messages: pastMessages,
            prompt
          });

          for await (const chunk of generator) {
            fullAssistantReply += chunk;
            const data = `data: ${JSON.stringify({ type: 'text', text: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          // 완료 후 DB 저장
          await supabase.from('chat_messages').insert([
            { conversation_id: currentConversationId, role: 'user', content: prompt },
            { conversation_id: currentConversationId, role: 'assistant', content: fullAssistantReply }
          ]);

          // updatedAt 갱신
          await supabase.from('chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', currentConversationId);

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          console.error("Streaming or DB save error:", error);
          const errData = `data: ${JSON.stringify({ type: 'error', error: error.message || 'Stream error' })}\n\n`;
          controller.enqueue(encoder.encode(errData));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("API Error in chat route:", error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
