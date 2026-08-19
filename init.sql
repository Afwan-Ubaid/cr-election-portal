-- SQL Schema for Class CR Election Portal (With voter restrictions & device fingerprinting)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Polls Table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manifesto TEXT,
  avatar_id TEXT NOT NULL DEFAULT 'avatar1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Eligible Voters List (Strictly restricts who can vote)
CREATE TABLE IF NOT EXISTS eligible_voters (
  roll_no TEXT PRIMARY KEY -- e.g. 'l253100'
);

-- 4. Votes Table (with UNIQUE constraint and browser device fingerprint tracking)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  roll_no TEXT NOT NULL REFERENCES eligible_voters(roll_no), -- Restricts votes to eligible list
  email TEXT NOT NULL,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL, -- Tracks physical browser signature
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, roll_no)
);

-- 5. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  roll_no TEXT NOT NULL,
  email TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  device_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'vote_success', 'vote_attempt_duplicate', 'vote_invalid'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Poll
INSERT INTO polls (id, title, is_active)
VALUES ('d8f8e0fa-9867-4279-b1d5-2ee6bf35ff88', 'Class Representative Election', TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Seed Candidates
INSERT INTO candidates (id, poll_id, name, manifesto, avatar_id)
VALUES 
  ('c1f8e0fa-9867-4279-b1d5-2ee6bf35ff01', 'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88', 'Zainab Ahmed', 'Dedicated to bridging the gap between students and faculty. Let''s secure better lab timings and organized class notes!', 'avatar1'),
  ('c2f8e0fa-9867-4279-b1d5-2ee6bf35ff02', 'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88', 'Hamza Khan', 'Creating a collaborative classroom atmosphere. I will lobby for flexible deadlines and coordinate exam prep sessions.', 'avatar2'),
  ('c3f8e0fa-9867-4279-b1d5-2ee6bf35ff03', 'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88', 'Ayesha Siddiqui', 'Transparency is key. Weekly feedback forms to address your complaints and organise better class socials.', 'avatar3')
ON CONFLICT (id) DO NOTHING;
-- Note: Seeding of eligible voters list has been moved to the gitignored seed_voters.sql to keep the voter list private.
