'use server';

import { revalidatePath } from 'next/cache';
import { getAuthUser, createServerClient } from '@/lib/auth-helpers';
import { createListingSchema, categorySchema } from '@/lib/validators';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const getSupabaseClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export async function getListingByIdAction(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles (
        id,
        full_name,
        avatar_url,
        bio,
        skills_offered,
        average_rating
      )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error fetching listing:', error);
    return null;
  }

  return data;
}

export async function getMyListingsAction() {
  const user = await getAuthUser();
  if (!user) throw new Error('Authentication required');

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  return data || [];
}

export async function createListingAction(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Authentication required' };

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    tags: formData.get('tags'),
    availability: formData.get('availability'),
  };

  const parsed = createListingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || 'Validation error',
    };
  }

  const supabase = getSupabaseClient();

  const tags = parsed.data.tags || [];
  const { data, error } = await supabase
    .from('listings')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      tags,
      availability: parsed.data.availability,
      user_id: user.id,
      status: 'active',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating listing:', error);
    return { ok: false, error: error.message || 'Failed to create listing' };
  }

  revalidatePath('/browse');
  revalidatePath('/');

  return { ok: true, data };
}

export async function updateListingAction(id: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Authentication required' };

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    tags: formData.get('tags'),
    availability: formData.get('availability'),
  };

  const parsed = createListingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || 'Validation error',
    };
  }

  const supabase = getSupabaseClient();

  const tags = parsed.data.tags || [];
  const { data, error } = await supabase
    .from('listings')
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      tags,
      availability: parsed.data.availability,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating listing:', error);
    return { ok: false, error: error.message || 'Failed to update listing' };
  }

  revalidatePath('/browse');
  revalidatePath('/');

  return { ok: true, data };
}

export async function toggleListingActiveAction(id: string) {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Authentication required' };

  const supabase = getSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from('listings')
    .select('is_active')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: 'Listing not found' };
  }

  const { error } = await supabase
    .from('listings')
    .update({ is_active: !existing.is_active })
    .eq('id', id);

  if (error) {
    console.error('Error toggling listing:', error);
    return { ok: false, error: error.message || 'Failed to update listing' };
  }

  revalidatePath('/browse');

  return { ok: true };
}
