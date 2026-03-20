-- Envision Platform — PostgreSQL Schema

-- Admin users (agency staff)
CREATE TABLE admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  role        VARCHAR(50) DEFAULT 'admin',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  company       VARCHAR(255),
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(50),
  stage         VARCHAR(50) DEFAULT 'lead',
  -- stages: lead, proposal, active, revision, delivered, archived
  project_type  VARCHAR(100),
  budget        DECIMAL(10,2),
  revenue       DECIMAL(10,2),
  notes         TEXT,
  tags          TEXT[],
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Client portals (one per client project)
CREATE TABLE portals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
  slug          VARCHAR(100) UNIQUE NOT NULL,  -- used in URL
  password_hash VARCHAR(255) NOT NULL,
  template_id   VARCHAR(50) DEFAULT 'brand-reveal-v1',
  status        VARCHAR(50) DEFAULT 'draft',
  -- statuses: draft, active, expired, archived
  content       JSONB DEFAULT '{}',  -- all portal content stored here
  expires_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Portal analytics events
CREATE TABLE portal_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id   UUID REFERENCES portals(id) ON DELETE CASCADE,
  event_type  VARCHAR(50) NOT NULL,
  -- types: login, scroll, section_view, video_play, approve, comment, logout
  payload     JSONB DEFAULT '{}',
  ip_hash     VARCHAR(64),  -- hashed for privacy
  user_agent  TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  title       VARCHAR(500) NOT NULL,
  description TEXT,
  assignee    VARCHAR(255),
  priority    VARCHAR(20) DEFAULT 'medium',
  status      VARCHAR(50) DEFAULT 'todo',
  due_date    DATE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Notes (internal)
CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
  author      VARCHAR(255),
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Finance / expenses
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  plaid_item_id   VARCHAR(255),
  amount          DECIMAL(10,2) NOT NULL,
  description     VARCHAR(500),
  category        VARCHAR(100),
  date            DATE NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Plaid tokens (encrypted in production)
CREATE TABLE plaid_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         VARCHAR(255) UNIQUE NOT NULL,
  access_token    VARCHAR(500) NOT NULL,
  institution     VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clients_stage    ON clients(stage);
CREATE INDEX idx_portals_slug     ON portals(slug);
CREATE INDEX idx_portal_events    ON portal_events(portal_id, created_at);
CREATE INDEX idx_tasks_client     ON tasks(client_id);
CREATE INDEX idx_tasks_status     ON tasks(status);
CREATE INDEX idx_expenses_client  ON expenses(client_id);
