import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// CORS headers for external access (e.g., portfolio site)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Your user ID - set this in environment variables
    const MY_USER_ID = process.env.MY_USER_ID;

    if (!MY_USER_ID) {
      return NextResponse.json(
        { error: 'MY_USER_ID not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Create Supabase client with service role for server-side access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch user's finished books with book details
    const { data: userBooks, error } = await supabase
      .from('user_books')
      .select(`*, books (*)`)
      .eq('user_id', MY_USER_ID)
      .eq('status', 'Finished')
      .order('end_date', { ascending: false });

    console.log('MY_USER_ID:', MY_USER_ID);
    console.log('Query result count:', userBooks?.length);
    console.log('Query error:', error);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch books', details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    // Transform data - only include specified fields
    const books = userBooks?.map((ub: any) => ({
      title: ub.books?.title,
      author: ub.books?.author,
      category: ub.books?.category,
      rating: ub.rating,
      finishedDate: ub.end_date,
    })) || [];

    // Calculate stats
    const ratedBooks = books.filter((b: any) => b.rating && b.rating > 0);
    const averageRating = ratedBooks.length > 0
      ? ratedBooks.reduce((sum: number, b: any) => sum + b.rating, 0) / ratedBooks.length
      : 0;

    return NextResponse.json(
      {
        books,
        stats: {
          totalFinishedBooks: books.length,
          averageRating: Math.round(averageRating * 10) / 10,
          lastUpdated: new Date().toISOString(),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
