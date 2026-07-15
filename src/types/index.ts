import { z } from 'zod';

// Base user interface for consistency across the application
export interface BaseUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  name?: string; // Optional for backward compatibility
  bio?: string | null;
  avatar?: string | null; // Optional for backward compatibility
  timezone?: string;
  skillsOffered?: string[];
  skillsWanted?: string[];
  averageRating?: number;
  isOnboarded?: boolean;
}

// Supabase user profile response type
export interface Profile {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  timezone: string;
  skills_offered: string[];
  skills_wanted: string[];
  average_rating: number;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

// Auth state types
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

// Route types (extracted from router-store.ts)
export type AppRoute =
  | { page: "home"; tab?: "signin" | "signup" }
  | { page: "browse"; params?: Record<string, string> }
  | { page: "listing"; id: string }
  | { page: "create-listing"; editId?: string }
  | { page: "profile"; id?: string }
  | { page: "edit-profile" }
  | { page: "sessions" }
  | { page: "session"; id: string }
  | { page: "notifications" }
  | { page: "messages"; conversationId?: string }
  | { page: "onboarding" };