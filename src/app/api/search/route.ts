import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          total: 0,
          query,
          type
        }
      });
    }

    const supabase = await createServerClient();

    const results: any[] = [];

    // Search based on type
    if (type === 'all' || type === 'listings') {
      // Search skill listings
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          category,
          tags,
          estimated_duration,
          created_at,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`ilike.title.%${query}%,ilike.description.%${query}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!listingsError && listings) {
        results.push(...listings.map(listing => ({
          id: `list_${listing.id}`,
          type: 'listing',
          title: listing.title,
          description: listing.description,
          category: listing.category,
          tags: listing.tags,
          estimatedDuration: listing.estimated_duration,
          relevance: calculateRelevance(query, listing.title + ' ' + listing.description),
          createdAt: listing.created_at,
          author: listing.profiles
        })));
      }
    }

    if (type === 'all' || type === 'users') {
      // Search users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          bio,
          skills_offered,
          skills_wanted,
          average_rating,
          created_at
        `)
        .or(`ilike.full_name.%${query}%,ilike.bio.%${query}%`)
        .range(offset, offset + limit - 1);

      if (!usersError && users) {
        results.push(...users.map(user => ({
          id: `user_${user.id}`,
          type: 'user',
          name: user.full_name,
          description: user.bio,
          skillsOffered: user.skills_offered,
          skillsWanted: user.skills_wanted,
          averageRating: user.average_rating,
          relevance: calculateRelevance(query, (user.full_name || '') + ' ' + (user.bio || '')),
          createdAt: user.created_at
        })));
      }
    }

    if (type === 'all' || type === 'conversations') {
      // Search conversations
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at
        `)
        .range(offset, offset + limit - 1);

      if (!conversationsError && conversations) {
        results.push(...conversations.map(conversation => ({
          id: `conv_${conversation.id}`,
          type: 'conversation',
          title: `Conversation ${conversation.id.substring(0, 8)}`,
          description: `Conversation from ${new Date(conversation.created_at).toLocaleDateString()}`,
          relevance: calculateRelevance(query, ''),
          createdAt: conversation.created_at
        })));
      }
    }

    // Sort results by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply limit after sorting
    const finalResults = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        results: finalResults,
        total: results.length,
        query,
        type,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateRelevance(query: string, text: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Exact match in title/name gets highest relevance
  if (lowerText.includes(lowerQuery)) {
    return 100;
  }
  
  // Partial match gets medium relevance
  const words = lowerQuery.split(' ');
  let matchCount = 0;
  
  words.forEach(word => {
    if (lowerText.includes(word)) {
      matchCount++;
    }
  });
  
  return matchCount * 25; // 25 points per matching word
}