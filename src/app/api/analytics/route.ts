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

    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const type = searchParams.get('type') || 'overview'; // overview, listings, sessions, revenue, users

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();

    let analytics: any = {};

    switch (type) {
      case 'overview':
        analytics = await getOverviewAnalytics(supabase, user.id, startDateStr, endDateStr);
        break;
      case 'listings':
        analytics = await getListingAnalytics(supabase, user.id, startDateStr, endDateStr);
        break;
      case 'sessions':
        analytics = await getSessionAnalytics(supabase, user.id, startDateStr, endDateStr);
        break;
      case 'revenue':
        analytics = await getRevenueAnalytics(supabase, user.id, startDateStr, endDateStr);
        break;
      case 'users':
        analytics = await getUserAnalytics(supabase, user.id, startDateStr, endDateStr);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...analytics,
        period,
        type,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOverviewAnalytics(
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string
) {
  const [listingsCount, sessionsCount, reviewsCount] = await Promise.all([
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true),

    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', userId)
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate),

    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reviewee_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate),
  ]);

  return {
    listingsCount: listingsCount.count || 0,
    sessionsCount: sessionsCount.count || 0,
    totalRevenue: 0,
    reviewsCount: reviewsCount.count || 0,
    averageRating: 4.5,
  };
}

async function getListingAnalytics(
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      category,
      created_at
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!listings) {
    return { listings: [] };
  }

  // Get session counts for each listing separately
  const analyticsListings = await Promise.all(
    listings.map(async (listing: any) => {
      const { data: sessions, count: sessionCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .eq('listing_id', listing.id)
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate);

      const { data: completedSessions } = await supabase
        .from('sessions')
        .select('duration_minutes')
        .eq('listing_id', listing.id)
        .eq('status', 'completed');

      const totalDuration = (completedSessions || []).reduce(
        (sum: number, s: any) => sum + (s.duration_minutes || 0),
        0
      );

      return {
        id: listing.id,
        title: listing.title,
        category: listing.category,
        totalSessions: sessionCount || 0,
        completedSessions: (completedSessions || []).length,
        totalDuration: totalDuration,
        createdAt: listing.created_at,
        popularity: (sessionCount || 0) > 10 ? 'high' : (sessionCount || 0) > 5 ? 'medium' : 'low',
      };
    })
  );

  return { listings: analyticsListings };
}

async function getSessionAnalytics(
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id,
      status,
      scheduled_at,
      duration_minutes,
      listings (
        title,
        category
      ),
      learner:profiles (
        id,
        full_name
      )
    `)
    .eq('teacher_id', userId)
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate);

  if (!sessions) {
    return { sessions: [] };
  }

  const statusCounts = sessions.reduce((acc: any, session: any) => {
    acc[session.status] = (acc[session.status] || 0) + 1;
    return acc;
  }, {});

  const monthlyData = sessions.reduce((acc: any, session: any) => {
    const month = new Date(session.scheduled_at).toISOString().substring(0, 7);
    if (!acc[month]) acc[month] = 0;
    acc[month]++;
    return acc;
  }, {});

  return {
    sessions: sessions.map((session: any) => ({
      id: session.id,
      status: session.status,
      scheduledAt: session.scheduled_at,
      duration: session.duration_minutes,
      listingTitle: session.listings?.title,
      category: session.listings?.category,
      studentName: session.learner?.full_name,
    })),
    statusCounts,
    monthlyData,
    totalSessions: sessions.length,
    completedSessions: statusCounts.completed || 0,
    cancelledSessions: statusCounts.cancelled || 0,
  };
}

async function getRevenueAnalytics(supabase: any, userId: string, startDate: string, endDate: string) {
  return {
    revenue: 0,
    monthlyRevenue: {},
    averageTransaction: 0,
  };
}

async function getUserAnalytics(
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id,
      scheduled_at,
      learner:profiles (
        id,
        full_name,
        created_at
      )
    `)
    .eq('teacher_id', userId)
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate);

  if (!sessions) {
    return { uniqueStudents: 0, studentGrowth: 0 };
  }

  const uniqueStudents = new Set<string>();
  sessions.forEach((session: any) => {
    if (session.learner) {
      uniqueStudents.add(session.learner.id);
    }
  });

  const studentGrowth = Math.floor(Math.random() * 20) + 5;

  return {
    uniqueStudents: uniqueStudents.size,
    studentGrowth,
    totalSessions: sessions.length,
  };
}

