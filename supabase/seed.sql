-- SkillSwap demo seed data
-- Safe to re-run: inserts use fixed UUIDs with ON CONFLICT DO NOTHING;
-- profile fields are applied via UPDATE so re-runs stay idempotent.
-- Demo login for every user: password "Password123!"

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Demo auth users (profiles are created automatically by the
--    on_auth_user_created trigger). Passwords are bcrypt-hashed.
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alice@example.com', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bob@example.com',   crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carol@example.com', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'david@example.com', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emma@example.com',  crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'frank@example.com', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false)
ON CONFLICT (id) DO NOTHING;

-- GoTrue scans several auth.users text columns as non-null strings, so any
-- NULLs must be coerced to empty strings or login fails with
-- "Database error querying schema".
UPDATE auth.users SET
  confirmation_token = COALESCE(confirmation_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change = COALESCE(email_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  phone_change = COALESCE(phone_change, '')
WHERE email LIKE '%@example.com';

-- ---------------------------------------------------------------------------
-- 2. Profile details (avatars left NULL so the app shows generated initials)
-- ---------------------------------------------------------------------------
UPDATE profiles SET full_name = 'Alice Johnson',  bio = 'Full-stack developer who loves teaching web tech.', timezone = 'America/New_York', skills_offered = '["React","TypeScript","Node.js"]', skills_wanted = '["Guitar","Spanish"]', average_rating = 4.8, is_onboarded = true WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE profiles SET full_name = 'Bob Smith',      bio = 'Music teacher and session guitarist.', timezone = 'Europe/London', skills_offered = '["Guitar","Music Theory"]', skills_wanted = '["Photography","Cooking"]', average_rating = 4.6, is_onboarded = true WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE profiles SET full_name = 'Carol Williams', bio = 'Home cook sharing family recipes.', timezone = 'Asia/Kolkata', skills_offered = '["Indian Cooking","Baking"]', skills_wanted = '["Yoga","Public Speaking"]', average_rating = 4.9, is_onboarded = true WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE profiles SET full_name = 'David Lee',      bio = 'Spanish tutor and language enthusiast.', timezone = 'America/Mexico_City', skills_offered = '["Spanish","English"]', skills_wanted = '["Guitar","Design"]', average_rating = 4.7, is_onboarded = true WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE profiles SET full_name = 'Emma Davis',     bio = 'UX designer mentoring juniors.', timezone = 'Europe/Berlin', skills_offered = '["UI/UX Design","Figma"]', skills_wanted = '["React","Writing"]', average_rating = 4.5, is_onboarded = true WHERE id = '55555555-5555-5555-5555-555555555555';
UPDATE profiles SET full_name = 'Frank Miller',   bio = 'Fitness coach and marathon runner.', timezone = 'Australia/Sydney', skills_offered = '["Fitness","Yoga"]', skills_wanted = '["Cooking","Spanish"]', average_rating = 4.4, is_onboarded = true WHERE id = '66666666-6666-6666-6666-666666666666';

-- ---------------------------------------------------------------------------
-- 3. Listings (tags stored as JSON text to match the app's safeJsonArray)
-- ---------------------------------------------------------------------------
INSERT INTO listings (id, user_id, title, description, category, tags, difficulty_level, estimated_duration, learning_outcomes, prerequisites, is_active, status) VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Learn React from Scratch', 'Build your first interactive UI with React and hooks.', 'Technology', '["React","JavaScript","Frontend"]', 'beginner', 60, '{"Components","State","Hooks"}', '{"Basic JavaScript"}', true, 'active'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'TypeScript for JavaScript Devs', 'Level up with static typing and generics.', 'Technology', '["TypeScript","JavaScript"]', 'intermediate', 90, '{"Types","Generics"}', '{"JavaScript"}', true, 'active'),
  ('a3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Acoustic Guitar Basics', 'Strum your first chords and simple songs.', 'Music', '["Guitar","Music"]', 'beginner', 60, '{"Chords","Strumming"}', '{}', true, 'active'),
  ('a4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Music Theory Fundamentals', 'Understand scales, keys, and rhythm.', 'Music', '["Music Theory","Ear Training"]', 'intermediate', 60, '{"Scales","Rhythm"}', '{}', true, 'active'),
  ('a5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Authentic Indian Cooking', 'Cook restaurant-style curries at home.', 'Cooking', '["Cooking","Indian"]', 'beginner', 120, '{"Spices","Curries"}', '{}', true, 'active'),
  ('a6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'Sourdough Baking 101', 'Bake a crusty loaf from a live starter.', 'Cooking', '["Baking","Bread"]', 'intermediate', 120, '{"Starter","Proofing"}', '{}', true, 'active'),
  ('a7777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'Conversational Spanish', 'Speak confidently in everyday situations.', 'Language', '["Spanish","Language"]', 'beginner', 60, '{"Greetings","Travel Phrases"}', '{}', true, 'active'),
  ('a8888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'UI/UX Design Crash Course', 'Design usable interfaces with Figma.', 'Design', '["Design","Figma","UX"]', 'beginner', 90, '{"Wireframes","Prototyping"}', '{}', true, 'active'),
  ('a9999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', 'Beginner Yoga Flow', 'Gentle mobility and breathing practice.', 'Fitness', '["Yoga","Fitness"]', 'beginner', 60, '{"Poses","Breathing"}', '{}', true, 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', '5K to Marathon Plan', 'Train smart from couch to finish line.', 'Fitness', '["Running","Fitness"]', 'advanced', 60, '{"Training Plan","Recovery"}', '{"Base fitness"}', true, 'active')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Availability for a few listings (Mon=1 .. Sun=6, start/end are 24h hours)
-- ---------------------------------------------------------------------------
INSERT INTO availability (listing_id, day_of_week, start_time, end_time) VALUES
  ('a1111111-1111-1111-1111-111111111111', 1, 18, 20),
  ('a1111111-1111-1111-1111-111111111111', 3, 18, 20),
  ('a3333333-3333-3333-3333-333333333333', 2, 17, 19),
  ('a3333333-3333-3333-3333-333333333333', 4, 17, 19),
  ('a7777777-7777-7777-7777-777777777777', 5, 16, 18),
  ('a9999999-9999-9999-9999-999999999999', 6, 9, 11)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Mutual swaps (pure barter proposals)
-- ---------------------------------------------------------------------------
INSERT INTO mutual_swaps (id, proposer_id, receiver_id, proposer_skill_id, receiver_skill_id, status, proposed_time, duration, message) VALUES
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'pending', now() + interval '3 days', 60, 'Happy to teach you React if you show me guitar!'),
  ('b2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'a7777777-7777-7777-7777-777777777777', 'a5555555-5555-5555-5555-555555555555', 'accepted', now() + interval '2 days', 90, 'Lets swap Spanish for Indian cooking.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Sessions (accepted swap becomes a scheduled session)
-- ---------------------------------------------------------------------------
INSERT INTO sessions (id, learner_id, teacher_id, listing_id, status, scheduled_at, duration_minutes, video_link) VALUES
  ('c1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'a5555555-5555-5555-5555-555555555555', 'confirmed', now() + interval '2 days', 90, 'https://meet.example.com/swap')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Conversation + messages between Alice and Bob
-- ---------------------------------------------------------------------------
INSERT INTO conversations (id, listing_id) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversation_participants (conversation_id, user_id) VALUES
  ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('d1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

INSERT INTO messages (conversation_id, sender_id, content, message_type, is_read) VALUES
  ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Hey Bob! Loved your guitar listing.', 'text', true),
  ('d1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Thanks Alice! Ready to swap for React?', 'text', false)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Notifications
-- ---------------------------------------------------------------------------
INSERT INTO notifications (user_id, type, title, message, related_type, is_read) VALUES
  ('22222222-2222-2222-2222-222222222222', 'swap_proposal', 'New swap proposal', 'Alice wants to swap React for Guitar.', 'mutual_swap', false),
  ('33333333-3333-3333-3333-333333333333', 'swap_accepted', 'Swap accepted', 'David accepted your Indian Cooking swap.', 'mutual_swap', false),
  ('44444444-4444-4444-4444-444444444444', 'session_reminder', 'Upcoming session', 'Your cooking session is in 2 days.', 'session', false)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. Reviews (after a completed session)
-- ---------------------------------------------------------------------------
INSERT INTO reviews (reviewer_id, reviewee_id, session_id, rating, comment) VALUES
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 5, 'Carol is a fantastic cooking teacher!')
ON CONFLICT DO NOTHING;

COMMIT;
