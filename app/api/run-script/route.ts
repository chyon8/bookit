// app/api/run-script/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const backfillDescriptions = async () => {
  const log = (message: string) => {
    console.log(message);
    // In a real scenario, you might use a proper logging service
    // For this script, we'll just log to the console and collect logs.
  };

  const logs: string[] = [];
  const logAndCollect = (message: string) => {
    log(message);
    logs.push(message);
  }

  logAndCollect("Starting backfill process...");

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    const errorMsg = "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (as service key) environment variables.";
    logAndCollect(errorMsg);
    return { logs, error: errorMsg };
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: books, error: fetchError } = await supabase
      .from("books")
      .select("id, title, isbn13")
      .is("description", null)
      .not("isbn13", "is", null);

    if (fetchError) {
      const errorMsg = `Error fetching books: ${fetchError.message}`;
      logAndCollect(errorMsg);
      return { logs, error: errorMsg };
    }

    if (!books || books.length === 0) {
      logAndCollect("No books found that need a description backfill.");
      return { logs };
    }

    logAndCollect(`Found ${books.length} books to update. Processing...`);
    const updatedBooks: { title: string; }[] = [];

    for (const book of books) {
      if (!book.isbn13) continue;

      try {
        logAndCollect(`Fetching Aladin data for: ${book.title} (ISBN: ${book.isbn13})`);
        
        // The API route is running on the same server, so we can use localhost.
        const response = await fetch(`http://localhost:3000/api/aladin-search?query=${book.isbn13}`);

        if (!response.ok) {
            const errorText = await response.text();
            logAndCollect(`Failed to fetch from Aladin API for ISBN ${book.isbn13}. Status: ${response.status}. Error: ${errorText}`);
            continue;
        }

        const data = await response.json();
        const aladinBook = data?.item?.[0];
        const description = aladinBook?.description;

        if (description && description.trim() !== '') {
          const { data: updateData, error: updateError } = await supabase
            .from("books")
            .update({ description: description })
            .eq("id", book.id)
            .select();

          if (updateError) {
            logAndCollect(`Failed to update book "${book.title}": ${updateError.message}`);
          } else if (updateData && updateData.length > 0) {
            logAndCollect(`Successfully updated and verified: ${book.title}. Response: ${JSON.stringify(updateData)}`);
            updatedBooks.push({ title: book.title });
          } else {
            logAndCollect(`Update call for "${book.title}" returned no data and no error. This likely means RLS or permissions prevented the update. Data: ${JSON.stringify(updateData)}`);
          }
        } else {
          logAndCollect(`No description found for "${book.title}" in Aladin response. Setting to empty string.`);
          const { data: updateData, error: updateError } = await supabase
            .from("books")
            .update({ description: '' })
            .eq("id", book.id)
            .select();
            
          if (updateError) {
            logAndCollect(`Failed to update book "${book.title}" with empty string: ${updateError.message}`);
          } else if (updateData && updateData.length > 0) {
             logAndCollect(`Successfully set empty string for: ${book.title}.`);
          } else {
            logAndCollect(`Update (empty string) for "${book.title}" returned no data and no error. RLS issue likely.`);
          }
        }
      } catch (e: any) {
        logAndCollect(`An error occurred while processing "${book.title}": ${e.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logAndCollect("\n--- Backfill Process Complete ---");
    if (updatedBooks.length > 0) {
      logAndCollect("The following books were updated with a description:");
      updatedBooks.forEach(b => {
        logAndCollect(`- ${b.title}`);
      });
    } else {
      logAndCollect("No books were updated in this run.");
    }
    return { logs, updatedBooks };
  } catch (e: any) {
    const errorMsg = `An unexpected error occurred: ${e.message}`;
    logAndCollect(errorMsg);
    return { logs, error: errorMsg };
  }
};


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // This is a simple security measure. 
  // In a real app, use a more robust, time-limited secret.
  if (secret !== 'gemini-secret-backfill-key') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { logs, updatedBooks, error } = await backfillDescriptions();
  
  if (error) {
     return NextResponse.json({
        message: "Script finished with errors.",
        logs: logs,
      }, { status: 500 });
  }

  return NextResponse.json({
    message: "Script finished successfully.",
    logs: logs,
    updatedBooks: updatedBooks,
  });
}
