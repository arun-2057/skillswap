import { NextRequest, NextResponse } from 'next/server';

// WebSocket endpoint has been replaced with Supabase Realtime.
// Real-time features (chat, notifications, video signaling) now use
// Supabase Realtime subscriptions and broadcast channels instead.

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: true, message: 'Use Supabase Realtime instead of WebSocket.' },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: true, message: 'Use Supabase Realtime instead of WebSocket.' },
    { status: 200 }
  );
}