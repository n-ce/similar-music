
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { title, artist } = request.query;
  const apiKey = process.env.LASTFM_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'LASTFM_API_KEY is not configured' });
  }

  if (!title || !artist) {
    return response.status(400).json({ error: 'Missing title or artist parameter' });
  }

  const url = `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${artist}&track=${title}&api_key=${apiKey}&format=json`;

  try {
    const lastFmResponse = await fetch(url);
    const data = await lastFmResponse.json();

    if (data.error) {
      return response.status(500).json({ error: data.message });
    }

    const tracks = data.similartracks.track.map((track: any) => ({
      name: track.name,
      artist: track.artist.name,
      url: track.url,
      duration: track.duration,
      playcount: track.playcount,
      match: track.match,
      image: track.image,
    }));

    return response.status(200).json(tracks);
  } catch (error) {
    return response.status(500).json({ error: 'Something went wrong' });
  }
}
