CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL
);

CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10, 2),
  base_currency VARCHAR(10) DEFAULT 'MYR',
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  completed_at DATETIME NULL,
  deleted_at DATETIME NULL
);

-- Idempotent ALTERs for upgrading existing databases (ignore errors if columns already exist)
-- Run these manually if needed:
-- ALTER TABLE trips ADD COLUMN is_completed TINYINT(1) NOT NULL DEFAULT 0;
-- ALTER TABLE trips ADD COLUMN completed_at DATETIME NULL;
-- ALTER TABLE trips ADD COLUMN deleted_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS trip_assignments (
  trip_id VARCHAR(36),
  user_id VARCHAR(36),
  personal_budget DECIMAL(10, 2) DEFAULT 0,
  PRIMARY KEY (trip_id, user_id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS itinerary_items (
  id VARCHAR(36) PRIMARY KEY,
  trip_id VARCHAR(36),
  day INT,
  time VARCHAR(10),
  duration INT,
  date DATE,
  title VARCHAR(255),
  description TEXT,
  url VARCHAR(500),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(36) PRIMARY KEY,
  trip_id VARCHAR(36),
  user_id VARCHAR(36),
  amount DECIMAL(10, 2),
  category VARCHAR(50),
  note TEXT,
  date DATE,
  type ENUM('group', 'individual') DEFAULT 'individual',
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budget_logs (
  id VARCHAR(36) PRIMARY KEY,
  trip_id VARCHAR(36),
  amount DECIMAL(10, 2),
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- Seed initial data
INSERT INTO users (id, username, password, role) VALUES 
('1', 'admin', 'password', 'admin'),
('2', 'user1', 'password', 'user')
ON DUPLICATE KEY UPDATE username=username;
