/*
# Create channels table

1. New Tables
- `channels`
  - `id` (uuid, primary key)
  - `name` (text, required) - display name of the channel
  - `category` (text, required) - one of the site categories
  - `quality` (text) - label such as "1080p HD"
  - `viewers` (text) - display count shown on cards
  - `current_event` (text) - current program title
  - `stream_url` (text, required) - HLS (.m3u8) or MP4 URL
  - `poster_url` (text) - thumbnail image URL
  - `created_at` (timestamptz) - when the channel was added

2. Seed data
- Inserts sample channels only when the table is empty, using public sample streams.

3. Security
- Row level security enabled.
- anon and authenticated roles can read and add channels (no sign-in in this app, data is intentionally shared).
- Updates and deletes are not granted.

4. Notes
- Idempotent: safe to re-run.
*/

CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  quality text,
  viewers text,
  current_event text,
  stream_url text NOT NULL,
  poster_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS channels_category_idx ON channels (category);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON channels TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_channels" ON channels;
CREATE POLICY "anon_select_channels" ON channels FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_channels" ON channels;
CREATE POLICY "anon_insert_channels" ON channels FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM channels) THEN
    INSERT INTO channels (name, category, quality, viewers, current_event, stream_url, poster_url) VALUES
      ('Sample Cricket HD', 'Cricket', '1080p HD', '248.5K', 'Sample match highlights', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80'),
      ('Sample Football 4K', 'Football', '4K UHD', '176.4K', 'Sample football feature', 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80'),
      ('Sample Hockey HD', 'Hockey', '1080p HD', '68.7K', 'Sample hockey replay', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=1000&q=80'),
      ('Sample Cartoon HD', 'Cartoon', '1080p HD', '134.0K', 'Sample animated feature', 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1000&q=80'),
      ('Sample Wildlife 4K', 'Wildlife & Nature', '4K HDR', '74.9K', 'Sample nature documentary', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1000&q=80'),
      ('Sample Science HD', 'Science & Docs', '1080p HD', '49.4K', 'Sample science program', 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80');
  END IF;
END $$;
