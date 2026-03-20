-- Run this once against your Railway PostgreSQL DB
-- Adds the portal_comments table

CREATE TABLE IF NOT EXISTS portal_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id   UUID REFERENCES portals(id) ON DELETE CASCADE,
  section     VARCHAR(100) DEFAULT 'general',
  text        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_comments ON portal_comments(portal_id, created_at);
