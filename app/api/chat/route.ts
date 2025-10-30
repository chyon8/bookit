import { NextResponse } from 'next/server';
import { getChatResponse } from '../../../services/geminiService';

export async function POST(request: Request) {
  try {
    const { books, prompt } = await request.json();

    if (!books || !prompt) {
      return NextResponse.json({ error: 'Books and prompt are required' }, { status: 400 });
    }
    
    const responseText = await getChatResponse(books, prompt);
    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error("API Error in chat:", error);
    return NextResponse.json({ error: 'Failed to get chat response' }, { status: 500 });
  }
}
