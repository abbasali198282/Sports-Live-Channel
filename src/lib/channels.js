import { supabase } from './supabase.js';

const DEFAULT_POSTER =
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80';

const COLUMNS = 'id, name, category, quality, viewers, current_event, stream_url, poster_url';

function toChannel(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quality: row.quality ?? '',
    viewers: row.viewers ?? '',
    currentEvent: row.current_event ?? '',
    streamUrl: row.stream_url,
    poster: row.poster_url || DEFAULT_POSTER,
  };
}

export async function fetchChannels() {
  const { data, error } = await supabase
    .from('channels')
    .select(COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected response from database');
  return data.map(toChannel);
}

export async function insertChannel({ name, category, streamUrl }) {
  const { data, error } = await supabase
    .from('channels')
    .insert({
      name,
      category,
      quality: 'CUSTOM HLS',
      viewers: 'LIVE',
      current_event: `Live ${category} Broadcast`,
      stream_url: streamUrl,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toChannel(data);
}
