// app/api/debug-books/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'gemini-secret-backfill-key') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: books, error } = await supabase
      .from('books')
      .select('title, isbn13, description')
      .limit(10);

    if (error) {
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ books });

  } catch (e: any) {
    return NextResponse.json({ error: `An unexpected error occurred: ${e.message}` }, { status: 500 });
  }
}
