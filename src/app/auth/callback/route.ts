import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '../../../lib/supabase/database.types';

function emailOtpType(value: string | null): EmailOtpType | null {
  switch (value) {
    case 'signup':
    case 'invite':
    case 'recovery':
    case 'email_change':
    case 'magiclink':
    case 'email':
      return value;
    default:
      return null;
  }
}

function safeNextPath(value: string | null): string {
  return value === '/auth/set-password' ? value : '/';
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const nextPath = safeNextPath(url.searchParams.get('next'));
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const otpType = emailOtpType(url.searchParams.get('type'));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return NextResponse.redirect(new URL('/auth/set-password?error=configuration', url.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  let error: Error | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash && otpType) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    error = result.error;
  } else {
    return NextResponse.redirect(new URL('/auth/set-password?error=invalid-link', url.origin));
  }

  if (error) {
    return NextResponse.redirect(new URL('/auth/set-password?error=invalid-link', url.origin));
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
