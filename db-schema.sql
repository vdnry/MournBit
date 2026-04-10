-- Markers Table
CREATE TABLE IF NOT EXISTS markers (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  tickets_generated INTEGER NOT NULL DEFAULT 0,
  tickets_approved INTEGER NOT NULL DEFAULT 0,
  tickets_cleared INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  tickets_claimed INTEGER NOT NULL DEFAULT 0,
  tickets_closed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Authority Table
CREATE TABLE IF NOT EXISTS authority (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  tickets_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  generated_by TEXT NOT NULL,
  approved_by TEXT,
  claimed_by TEXT,
  status TEXT NOT NULL DEFAULT 'Unclaimed', -- Unclaimed, In Progress, Cleared
  severity TEXT NOT NULL, -- Low, Medium, High
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  marker_photo_url TEXT NOT NULL,
  volunteer_photo_url TEXT,
  ticket_generation_time TEXT NOT NULL,
  ticket_claim_time TEXT,
  ticket_cleared_time TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (generated_by) REFERENCES markers(id),
  FOREIGN KEY (approved_by) REFERENCES authority(id),
  FOREIGN KEY (claimed_by) REFERENCES volunteers(id)
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_markers_email ON markers(email);
CREATE INDEX IF NOT EXISTS idx_markers_username ON markers(username);
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_username ON volunteers(username);
CREATE INDEX IF NOT EXISTS idx_authority_email ON authority(email);
CREATE INDEX IF NOT EXISTS idx_authority_username ON authority(username);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_generated_by ON tickets(generated_by);
CREATE INDEX IF NOT EXISTS idx_tickets_claimed_by ON tickets(claimed_by);
CREATE INDEX IF NOT EXISTS idx_tickets_approved_by ON tickets(approved_by);
CREATE INDEX IF NOT EXISTS idx_tickets_coordinates ON tickets(latitude, longitude);
