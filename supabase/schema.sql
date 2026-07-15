-- SkillSwap Database Schema for Supabase (Barter / Direct Swap Model)

-- Create Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  skills_offered JSONB DEFAULT '[]',
  skills_wanted JSONB DEFAULT '[]',
  average_rating NUMERIC DEFAULT 0,
  is_onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  difficulty_level TEXT DEFAULT 'intermediate',
  estimated_duration INTEGER DEFAULT 60,
  learning_outcomes TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  is_mentorship BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Availability table
CREATE TABLE IF NOT EXISTS availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time INTEGER NOT NULL CHECK (start_time >= 0 AND start_time <= 23),
  end_time INTEGER NOT NULL CHECK (end_time >= 0 AND end_time <= 23),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, day_of_week, start_time, end_time)
);

-- Create Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  video_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, session_id)
);

-- Create Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Conversation Participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Create Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  media_url TEXT,
  file_name TEXT,
  file_path TEXT,
  file_size INTEGER,
  file_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Mutual Swaps table (pure barter model, no credits)
DO $$
BEGIN
  CREATE TYPE swap_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS mutual_swaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  proposer_skill_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  receiver_skill_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  status swap_status DEFAULT 'pending',
  proposed_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutual_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_learner_id ON sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_session_id ON reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_mutual_swaps_proposer_id ON mutual_swaps(proposer_id);
CREATE INDEX IF NOT EXISTS idx_mutual_swaps_receiver_id ON mutual_swaps(receiver_id);
CREATE INDEX IF NOT EXISTS idx_mutual_swaps_status ON mutual_swaps(status);
-- Composite indexes for efficient marketplace queries
CREATE INDEX IF NOT EXISTS idx_mutual_swaps_receiver_status ON mutual_swaps(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_mutual_swaps_proposer_status ON mutual_swaps(proposer_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_status ON sessions(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_learner_status ON sessions(learner_id, status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Security definer function to check conversation participant (avoids repeated EXISTS in RLS)
CREATE OR REPLACE FUNCTION user_is_conversation_participant(conversation_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  exists_participant BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversation_uuid
    AND user_id = auth.uid()
  ) INTO exists_participant;
  RETURN exists_participant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security definer function to check listing ownership
CREATE OR REPLACE FUNCTION user_owns_listing(listing_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  exists_owner BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM listings
    WHERE id = listing_uuid
    AND user_id = auth.uid()
  ) INTO exists_owner;
  RETURN exists_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_mutual_swaps_updated_at
  BEFORE UPDATE ON mutual_swaps
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Marketplace needs public read access to basic profile info (name, avatar, rating)
CREATE POLICY "Profiles are publicly viewable" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Listings policies
CREATE POLICY "Users can view listings" ON listings
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can view sessions" ON sessions
  FOR SELECT USING (
    auth.uid() = learner_id OR
    auth.uid() = teacher_id OR
    user_owns_listing(sessions.listing_id)
  );

CREATE POLICY "Users can create sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (
    auth.uid() = learner_id OR
    auth.uid() = teacher_id
  );

-- Reviews policies
CREATE POLICY "Users can view reviews" ON reviews
  FOR SELECT USING (
    auth.uid() = reviewer_id OR
    auth.uid() = reviewee_id
  );

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM sessions
      WHERE reviews.session_id = sessions.id
      AND sessions.learner_id = auth.uid()
    )
  );

-- Conversations policies
CREATE POLICY "Users can view conversations" ON conversations
  FOR SELECT USING (
    user_is_conversation_participant(conversations.id)
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    user_owns_listing(conversations.listing_id)
  );

-- Conversation participants policies
CREATE POLICY "Users can view own participants" ON conversation_participants
  FOR SELECT USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages" ON messages
  FOR SELECT USING (
    user_is_conversation_participant(messages.conversation_id)
  );

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    user_is_conversation_participant(messages.conversation_id)
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Mutual Swaps policies
CREATE POLICY "Users can view own swaps" ON mutual_swaps
  FOR SELECT USING (
    auth.uid() = proposer_id OR
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can create swaps" ON mutual_swaps
  FOR INSERT WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "Users can update own swaps" ON mutual_swaps
  FOR UPDATE USING (
    auth.uid() = proposer_id OR
    auth.uid() = receiver_id
  );

-- Availability policies
CREATE POLICY "Users can view availability" ON availability
  FOR SELECT USING (
    user_owns_listing(availability.listing_id)
  );

CREATE POLICY "Users can create availability" ON availability
  FOR INSERT WITH CHECK (
    user_owns_listing(availability.listing_id)
  );

CREATE POLICY "Users can update own availability" ON availability
  FOR UPDATE USING (
    user_owns_listing(availability.listing_id)
  );

CREATE POLICY "Users can delete own availability" ON availability
  FOR DELETE USING (
    user_owns_listing(availability.listing_id)
  );

-- Enable Realtime for tables the app subscribes to (chat, notifications,
-- session/swap status changes). Idempotent: skips tables already in the
-- publication so the schema can be re-applied safely.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'public.conversations',
    'public.conversation_participants',
    'public.messages',
    'public.notifications',
    'public.sessions',
    'public.mutual_swaps'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = split_part(t, '.', 2)
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s', t);
    END IF;
  END LOOP;
END $$;

-- Grant privileges to the Supabase roles (normally done automatically by
-- `supabase start`; required here because the schema is applied manually).
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
