
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mocha_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_payment_confirmed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  team1_name TEXT NOT NULL,
  team2_name TEXT NOT NULL,
  team1_logo_url TEXT,
  team2_logo_url TEXT,
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  timer_duration INTEGER DEFAULT 2700,
  current_time INTEGER DEFAULT 0,
  is_timer_running BOOLEAN DEFAULT FALSE,
  current_half INTEGER DEFAULT 1,
  design_theme TEXT DEFAULT 'classic',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  confirmed_by_admin_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (mocha_user_id, email, name, is_admin, is_payment_confirmed) 
VALUES ('admin', 'admin@kstv.com', 'Admin', TRUE, TRUE);
