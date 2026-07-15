import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServerClient } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createServerClient();

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('learner_id, teacher_id, listing_id')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.learner_id !== user.id && session.teacher_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You are not a participant of this session' },
        { status: 403 }
      );
    }

    const teacherId = session.teacher_id;
    const learnerId = session.learner_id;
    const listingId = session.listing_id;

    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, conversation_participants ( user_id )')
      .eq('conversation_participants.user_id', user.id);

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return NextResponse.json(
        { success: false, error: 'Failed to load conversation' },
        { status: 500 }
      );
    }

    const existing = (conversations || []).find((c: any) => {
      const ids = (c.conversation_participants || []).map((p: any) => p.user_id);
      return ids.length === 2 && ids.includes(teacherId) && ids.includes(learnerId);
    });

    if (existing) {
      return NextResponse.json({ success: true, data: { id: existing.id } });
    }

    const now = new Date().toISOString();
    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId || null,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (createError || !created) {
      console.error('Error creating conversation:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: created.id, user_id: teacherId },
        { conversation_id: created.id, user_id: learnerId },
      ]);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      return NextResponse.json(
        { success: false, error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { id: created.id } });
  } catch (error) {
    console.error('Session conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
