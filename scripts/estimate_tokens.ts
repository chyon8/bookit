
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // remove quotes
        envVars[key] = value;
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const minifyBookData = (books: any[]) => {
    return books.map(b => ({
        t: b.books?.title || b.title,
        a: b.books?.author || b.author,
        c: b.books?.category || b.category,
        s: b.status,
        r: b.rating,
        ...(b.one_line_review && { rev: b.one_line_review }),
        ...(b.motivation && { mot: b.motivation }),
        ...(b.memorable_quotes && { q: b.memorable_quotes }),
        ...(b.learnings && { l: b.learnings }),
        ...(b.questions_from_book && { qs: b.questions_from_book }),
        ...(b.connected_thoughts && { th: b.connected_thoughts }),
        ...(b.overall_impression && { imp: b.overall_impression }),
        ...(b.notes && { n: b.notes })
    }));
};

async function estimateTokens() {
  console.log("Fetching books...");
  const { data: books, error } = await supabase
    .from("user_books")
    .select(`
      *,
      books (
        title,
        author,
        category,
        description
      )
    `);

  if (error) {
    console.error("Error fetching books:", error);
    return;
  }

  if (!books || books.length === 0) {
    console.log("No books found.");
    return;
  }

  const minified = minifyBookData(books);
  const jsonString = JSON.stringify(minified);
  const charCount = jsonString.length;
  // Crude estimation: ~4 chars per token for English, ~1-2 chars per token for Korean/Unicode often more complex but JSON is mix.
  // Gemini counts tokens differently, but char/4 is a safe lower bound, maybe char/2.5 for Korean mixed.
  // Let's us a conservative estimate for mixed CJK: ~3 chars per token? 
  // OpenAI says 1 token ~= 4 chars in English. 
  // For Korean, 1 character can be 1-3 tokens depending on encoding.
  // Let's just output char count and a range.

  console.log(`\n--- Analysis ---`);
  console.log(`Total Books: ${books.length}`);
  console.log(`Total Characters (Minified JSON): ${charCount}`);
  console.log(`Estimated Tokens (Optimistic /4): ~${Math.round(charCount / 4)}`);
  console.log(`Estimated Tokens (Conservative /2 for KR): ~${Math.round(charCount / 2)}`);
  
  // Sample book payload
  console.log(`\n--- Sample Entry (First Book) ---`);
  console.log(JSON.stringify(minified[0], null, 2));
}

estimateTokens();
