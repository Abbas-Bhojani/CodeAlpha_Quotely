ALTER TABLE quotes
ADD COLUMN source TEXT NOT NULL DEFAULT 'curated';

ALTER TABLE quotes
ADD COLUMN source_quote_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_source_quote
ON quotes(source, source_quote_id)
WHERE source_quote_id IS NOT NULL;

DROP TABLE IF EXISTS visitor_daily_quota;