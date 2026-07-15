import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServerClient } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = await createServerClient();

    const { data: conversations, error: conversationsError } = await supabase
      .from("conversations")
      .select(`
        id,
        listing_id,
        updated_at,
        listings ( title ),
        conversation_participants!inner (
          user_id,
          profiles (
            id,
            full_name,
            avatar_url
          )
        ),
        messages (
          id,
          sender_id,
          content,
          created_at,
          is_read
        )
      `)
      .eq("conversation_participants.user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: conversations || [] });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { participantId, initialMessage, listingId } = body;

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (conversationError || !conversation) {
      console.error('Error creating conversation:', conversationError);
      return NextResponse.json(
        { success: false, error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    const participantInserts = [
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: participantId },
    ];

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantInserts);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      return NextResponse.json(
        { success: false, error: 'Failed to add participants' },
        { status: 500 }
      );
    }

    if (initialMessage) {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: initialMessage,
          message_type: 'TEXT',
          is_read: false,
          created_at: new Date().toISOString(),
        });

      if (messageError) {
        console.error('Error creating message:', messageError);
      }
    }

    return NextResponse.json({ success: true, data: { id: conversation.id } });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
