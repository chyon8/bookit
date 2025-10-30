import { NextResponse } from 'next/server';
import { searchBooks } from '../../../services/geminiService';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    const results = await searchBooks(query);
    return NextResponse.json(results);

  } catch (error) {
    console.error("API Error in search-books:", error);
    return NextResponse.json({ error: 'Failed to search for books' }, { status: 500 });
  }
}
