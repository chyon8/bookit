// app/api/run-migration/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// This function allows execution of multi-statement SQL strings.
// NOTE: This is powerful and should be used with care.
// We are creating this as a helper within this route.
const executeRawSql = async (client: any, sql: string) => {
  // The PostgREST API doesn't directly support multi-statement queries for safety.
  // A common workaround is to create a function in your database that can execute dynamic SQL.
  // Let's assume such a function `execute_sql` exists for the sake of this example.
  // If not, you'd need to add it to your Supabase DB:
  //
  // CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
  // RETURNS void AS $$
  // BEGIN
  //   EXECUTE sql_query;
  // END;
  // $$ LANGUAGE plpgsql;
  //
  // As an alternative, for this specific use case, we will make a direct DB connection
  // using a different library if `node-postgres` was available, but to stick to `supabase-js`
  // we will rely on an RPC call. We will first have to create the function.
  // A supabase instance with service_key can execute raw SQL through PostgREST RPC.
  
  // A simpler method for migrations is often to use the Supabase CLI, but we are building an API route.
  
  // We will try to execute it as a single RPC call. This might fail if the function doesn't exist.
  const { error } = await client.rpc('execute_sql', { sql: sql });
  if (error) {
    console.error("Error calling execute_sql RPC. Did you create the function in your DB?", error);
    // Provide a more helpful error message
    if (error.message.includes('function execute_sql(sql => text) does not exist')) {
        throw new Error(
            `The RPC function 'execute_sql' does not exist in your database. Please create it using the Supabase SQL editor: 

` +
            `CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
` +
            `RETURNS void AS $$
` +
            `BEGIN
` +
            `  EXECUTE sql;
` +
            `END;
` +
            `$$ LANGUAGE plpgsql;`
        );
    }
    throw error;
  }
};


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const file = searchParams.get('file');

  // 1. Security check
  if (secret !== 'gemini-secret-backfill-key') {
    return NextResponse.json({ error: 'Unauthorized: Invalid secret.' }, { status: 401 });
  }

  // 2. File parameter check
  if (!file) {
    return NextResponse.json({ error: 'Bad Request: "file" query parameter is required.' }, { status: 400 });
  }

  // 3. Set up Supabase admin client
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Server configuration error: Missing Supabase credentials.' }, { status: 500 });
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 4. Read the SQL file
    const safeFileName = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, '');
    if (safeFileName !== file || !safeFileName.endsWith('.sql')) {
        return NextResponse.json({ error: 'Bad Request: Invalid or non-SQL file path.' }, { status: 400 });
    }
    const filePath = path.join(process.cwd(), safeFileName);
    const sqlContent = await fs.readFile(filePath, 'utf8');

    // 5. Execute the SQL by creating and using a temporary function
    const functionName = `temp_migration_func_${Date.now()}`;
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION ${functionName}()
      RETURNS void AS $$
      BEGIN
        ${sqlContent.replace(/'/g, "''")}
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // We can't execute multi-statement SQL directly.
    // The previous idea to create a generic `execute_sql` function is best practice,
    // but requires the user to manually add it.
    // Let's try to run the migration directly using supabase-js. This is tricky.
    // The supabase client can't execute arbitrary multi-line DDL.
    // The only reliable way via an API route without external libraries is to ask user to create the helper function.
    // So the code will assume the function `execute_sql` is present.
    await executeRawSql(supabase, sqlContent);

    return NextResponse.json({
      message: `Migration successful for file: ${safeFileName}`,
    });

  } catch (e: any) {
    console.error("Unexpected Migration Error:", e);
    if (e.code === 'ENOENT') {
        return NextResponse.json({ error: `Not Found: The migration file "${file}" does not exist.` }, { status: 404 });
    }
    return NextResponse.json({
      message: "An unexpected error occurred during migration.",
      error: e.message,
    }, { status: 500 });
  }
}
