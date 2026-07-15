import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          total: 0,
          filters: { type, category },
          query,
          pagination: { limit, offset }
        }
      });
    }

    const supabase = await createServerClient();

    const results: any[] = [];

    // Build base query
    let baseQuery = supabase.from('listings').select(`
      id,
      title,
      description,
      category,
      tags,
      estimated_duration,
      created_at,
      updated_at,
      profiles (
        id,
        full_name,
        avatar_url,
        bio
      )
    `).eq('is_active', true);

    // Apply filters
    if (query) {
      baseQuery = baseQuery.or(`ilike.title.%${query}%,ilike.description.%${query}%`);
    }

    if (category) {
      baseQuery = baseQuery.eq('category', category);
    }

    // Apply sorting
    let orderBy: string;
    switch (sortBy) {
      case 'rating':
        orderBy = 'average_rating';
        break;
      case 'created':
        orderBy = 'created_at';
        break;
      case 'updated':
        orderBy = 'updated_at';
        break;
      default:
        orderBy = 'created_at';
    }

    const { data: listings, error: listingsError } = await baseQuery
      .order(orderBy, { ascending: sortOrder === 'asc' })
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

    // Search users if needed
    if (type === 'all' || type === 'users') {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          bio,
          skills_offered,
          skills_wanted,
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
          relevance: calculateRelevance(query, (user.full_name || '') + ' ' + (user.bio || '')),
          createdAt: user.created_at
        })));
      }
    }

    // Search conversations if needed
    if (type === 'all' || type === 'conversations') {
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

    // Sort results by relevance first, then by sort criteria
    results.sort((a, b) => {
      if (sortBy === 'relevance') {
        return sortOrder === 'asc' ? a.relevance - b.relevance : b.relevance - a.relevance;
      }
      
      // For other sort criteria, compare based on the field
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply limit after sorting
    const finalResults = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        results: finalResults,
        total: results.length,
        filters: { type, category },
        query,
        sortBy,
        sortOrder,
        pagination: { limit, offset, total: results.length }
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
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
  let score = 0;
  
  words.forEach(word => {
    if (lowerText.includes(word)) {
      matchCount++;
      // Earlier words in query get higher weight
      const wordIndex = lowerQuery.indexOf(word);
      score += (100 - wordIndex) / words.length;
    }
  });
  
  // Boost score if multiple words match
  if (matchCount > 1) {
    score *= 1.5;
  }
  
  return Math.min(100, Math.round(score));
}