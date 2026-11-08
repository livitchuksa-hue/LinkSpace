CREATE TABLE IF NOT EXISTS information_objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    content TEXT,
    path TEXT,
    url TEXT,
    x REAL NOT NULL DEFAULT 0,
    y REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    label TEXT,
    FOREIGN KEY (source_id) REFERENCES information_objects(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES information_objects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT,
    coordinates TEXT
);
