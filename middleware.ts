import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // CORS handling
  const origin = request.headers.get('origin')
  const allowedOrigins = ['http://localhost:8081', 'http://localhost:3000']
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)

  // Handle simple requests and preflight requests
  const response = request.method === 'OPTIONS'
    ? new NextResponse(null, { status: 200 })
    : NextResponse.next({
        request: {
          headers: request.headers,
        },
      })

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin!)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
  }

  // Supabase auth logic (keep existing)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Update the response we created above, preserving headers
          const newResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Copy headers from our CORS/Options response to the new response
          response.headers.forEach((value, key) => {
             newResponse.headers.set(key, value)
          })
          
          newResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          
           // Update the response, preserving headers
          const newResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
           // Copy headers
          response.headers.forEach((value, key) => {
             newResponse.headers.set(key, value)
          })

          newResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
