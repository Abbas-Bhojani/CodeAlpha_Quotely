-- =========================================================
-- QUOTELY — Cloudflare D1 Schema
-- =========================================================
--
-- Visitor identity belongs to the trusted backend.
--
-- D1 assigns the numeric Visitor ID itself so browsers can
-- never choose or manipulate the sequence.
-- =========================================================


CREATE TABLE IF NOT EXISTS visitors (

    -- Becomes:
    -- 1 → 000001
    -- 2 → 000002
    -- 3 → 000003
    visitor_number INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Human-readable name used on shared QUOTELY images.
    display_name TEXT,

    -- The real recovery code is never stored.
    recovery_hash TEXT NOT NULL,

    -- The browser receives a random session token.
    -- Only its protected verifier is stored here.
    session_hash TEXT NOT NULL UNIQUE,

    created_at TEXT NOT NULL,

    last_seen_at TEXT NOT NULL,

    is_active INTEGER NOT NULL DEFAULT 1
);


CREATE INDEX IF NOT EXISTS idx_visitors_session_hash
ON visitors(session_hash);

/* =========================================================
   Recovery Rate Limits
   ========================================================= */

CREATE TABLE IF NOT EXISTS recovery_rate_limits (
    rate_key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 0,
    window_started_at INTEGER NOT NULL
);

/* =========================================================
   Saved Thoughts
   ========================================================= */

CREATE TABLE IF NOT EXISTS saved_thoughts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    visitor_number INTEGER NOT NULL,

    quote_text TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,

    saved_at TEXT NOT NULL,

    FOREIGN KEY (visitor_number)
        REFERENCES visitors(visitor_number)
        ON DELETE CASCADE
);


/*
 * Prevent the same visitor from saving the exact same quote
 * multiple times.
 */
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_thought_unique
ON saved_thoughts (
    visitor_number,
    quote_text,
    author
);


/*
 * Makes loading one visitor's saved collection efficient.
 */
CREATE INDEX IF NOT EXISTS idx_saved_thought_visitor
ON saved_thoughts (
    visitor_number,
    saved_at
);

/* =========================================================
   QUOTELY Quote Catalogue
   ========================================================= */

CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    quote_text TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL
);


CREATE INDEX IF NOT EXISTS idx_quotes_category
ON quotes (
    category,
    is_active
);

/*
 * Prevent imported providers from filling the catalogue
 * with the same quote repeatedly.
 */
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_unique_content
ON quotes (
    quote_text,
    author
);


/* =========================================================
   Daily Visitor Quote Allowance
   ========================================================= */

CREATE TABLE IF NOT EXISTS visitor_daily_quota (
    visitor_number INTEGER NOT NULL,
    quota_date TEXT NOT NULL,
    generated_count INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (
        visitor_number,
        quota_date
    ),

    FOREIGN KEY (visitor_number)
        REFERENCES visitors(visitor_number)
        ON DELETE CASCADE
);


/* =========================================================
   Generated Thought History
   ========================================================= */

CREATE TABLE IF NOT EXISTS generated_thoughts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    visitor_number INTEGER NOT NULL,
    quote_id INTEGER NOT NULL,

    generated_at TEXT NOT NULL,

    FOREIGN KEY (visitor_number)
        REFERENCES visitors(visitor_number)
        ON DELETE CASCADE,

    FOREIGN KEY (quote_id)
        REFERENCES quotes(id)
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_generated_thoughts_visitor
ON generated_thoughts (
    visitor_number,
    generated_at
);