-- Pulse ISB: Seed places + add missing columns
-- Run in Supabase SQL editor

-- Ensure columns exist
ALTER TABLE places ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE places ADD COLUMN IF NOT EXISTS google_rating numeric(2,1);
ALTER TABLE places ADD COLUMN IF NOT EXISTS review_count integer;
ALTER TABLE places ADD COLUMN IF NOT EXISTS distance_from_campus text;
ALTER TABLE places ADD COLUMN IF NOT EXISTS google_maps_url text;

-- Insert Pal Dhaba (upsert on name to avoid duplicates)
INSERT INTO places (name, category, area, description, budget, google_maps_url, google_rating, review_count, distance_from_campus)
VALUES (
  'Pal Dhaba',
  'restaurant',
  'Sector 60, SAS Nagar',
  'No-frills dhaba near campus that ISB students swear by. Buttery dal makhani, fresh rotis, and a cold lassi that fixes everything. Open late — perfect for post-session hunger.',
  'low',
  'https://maps.app.goo.gl/q5LJMdJneoikzDzr6',
  4.2,
  120,
  '10 min drive'
)
ON CONFLICT DO NOTHING;
