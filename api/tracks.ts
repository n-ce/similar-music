import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSimilarTracks } from './lastfm_api.ts';
import { getYouTubeSong, type YouTubeSong } from './get_youtube_song.ts';

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

  try {
    const lastFmData = await getSimilarTracks(title as string, artist as string, apiKey);

    if ('error' in lastFmData) {
      return response.status(500).json({ error: lastFmData.error });
    }

    const matchedYouTubeSongs: (YouTubeSong | null)[] = [];

    for (const lastFmTrack of lastFmData) {
      const searchQuery = `${lastFmTrack.title} ${lastFmTrack.artist}`;

      const youtubeSong = await getYouTubeSong(searchQuery);

      if ('id' in youtubeSong) {
        matchedYouTubeSongs.push(youtubeSong as YouTubeSong);
      }
    }


    return response.status(200).json(matchedYouTubeSongs);
  } catch (error) {
    console.error('Error in API handler:', error);
    return response.status(500).json({ error: 'Something went wrong' });
  }
}
