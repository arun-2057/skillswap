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

    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        id,
        status,
        scheduled_at,
        duration_minutes,
        video_link,
        message,
        created_at,
        listing:listings (
          id,
          title,
          category
        ),
        learner:profiles (
          id,
          full_name,
          avatar_url
        ),
        teacher:profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const learner = Array.isArray(session.learner) ? session.learner[0] : session.learner;
    const teacher = Array.isArray(session.teacher) ? session.teacher[0] : session.teacher;

    if (learner?.id !== user.id && teacher?.id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You are not a participant of this session' },
        { status: 403 }
      );
    }

    const normalized = {
      id: session.id,
      status: session.status,
      scheduledAt: session.scheduled_at,
      durationMinutes: session.duration_minutes,
      videoLink: session.video_link,
      message: session.message,
      createdAt: session.created_at,
      listing: session.listing,
      learner,
      teacher,
      reviews: [],
    };

    return NextResponse.json({ success: true, data: normalized });
  } catch (err) {
    console.error('Error fetching session:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();

    const { data: existing, error: fetchError } = await supabase
      .from('sessions')
      .select('learner_id, teacher_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (existing.learner_id !== user.id && existing.teacher_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You are not a participant of this session' },
        { status: 403 }
      );
    }

    if (body.status) {
      const validTransitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['COMPLETED', 'CANCELLED'],
      };

      const allowed = validTransitions[existing.status] || [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid session status transition' },
          { status: 400 }
        );
      }
    }

    const { data: updated, error } = await supabase
      .from('sessions')
      .update({
        status: body.status,
        video_link: body.videoLink,
      })
      .eq('id', id)
      .select('id, status, scheduled_at, duration_minutes, video_link, message, created_at')
      .single();

    if (error || !updated) {
      console.error('Error updating session:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update session' },
        { status: 500 }
      );
    }

    const normalized = {
      ...updated,
      scheduledAt: updated.scheduled_at,
      durationMinutes: updated.duration_minutes,
      videoLink: updated.video_link,
      createdAt: updated.created_at,
    };

    return NextResponse.json({ success: true, data: normalized });
  } catch (err) {
    console.error('Error updating session:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
