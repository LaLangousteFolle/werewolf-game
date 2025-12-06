// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const url = new URL('/auth/callback', request.url);
  url.searchParams.set('code', code);
  return NextResponse.redirect(url);
}
