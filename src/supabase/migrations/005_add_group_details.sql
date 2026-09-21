-- Optional, generic short information shown on each group card.
ALTER TABLE groups ADD COLUMN IF NOT EXISTS details TEXT;
