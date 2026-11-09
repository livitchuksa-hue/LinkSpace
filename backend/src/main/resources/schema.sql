CREATE TABLE IF NOT EXISTS information_objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    content TEXT,
    path TEXT,
    url TEXT,
    disk TEXT,
    file_size INTEGER,
    file_created_at TEXT,
    file_modified_at TEXT,
    x REAL NOT NULL DEFAULT 0,
    y REAL NOT NULL DEFAULT 0,
    color TEXT,
    width REAL,
    height REAL,
    tags TEXT,
    z_index INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_opened_at TEXT
);

CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    label TEXT,
    color TEXT,
    z_index INTEGER,
    FOREIGN KEY (source_id) REFERENCES information_objects(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES information_objects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT,
    coordinates TEXT,
    shape TEXT,
    z_index INTEGER
);

CREATE TABLE IF NOT EXISTS workspace_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
