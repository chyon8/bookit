import { getChatResponseStream } from '../../../services/geminiService';

export async function POST(request: Request) {
  try {
    const { books, prompt } = await request.json();

    if (!books || !prompt) {
      return new Response(JSON.stringify({ error: 'Books and prompt are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of getChatResponseStream(books, prompt)) {
            const data = `data: ${JSON.stringify({ text: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
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

  } catch (error) {
    console.error("API Error in chat:", error);
    return new Response(JSON.stringify({ error: 'Failed to get chat response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
