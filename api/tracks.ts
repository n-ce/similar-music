import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSimilarTracks, type SimplifiedTrack } from './lastfm_api';
import { getYouTubeSong, type YouTubeSong } from './get_youtube_song';


export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { title, artist, limit } = request.query;
  const apiKey = process.env.LASTFM_API_KEY;

  if (!apiKey) {
    // For Vercel/serverless environments, use 500 status code for internal configuration errors
    return response.status(500).json({ error: 'LASTFM_API_KEY is not configured' });
  }

  if (!title || !artist) {
    return response.status(400).json({ error: 'Missing title or artist parameter' });
  }

  try {
    // 1. Fetch similar tracks (must be sequential first step)
    const lastFmData = await getSimilarTracks(title as string, artist as string, apiKey, limit as string || '5');

    if ('error' in lastFmData) {
      return response.status(500).json({ error: lastFmData.error });
    }

    // --- CONCURRENT FETCHING START ---

    // 2. Map the tracks to an array of Promises for concurrent execution.
    // The .map() executes getYouTubeSong immediately for every track.
    const youtubeSearchPromises = (lastFmData as SimplifiedTrack[]).map(lastFmTrack => {
      const searchQuery = `${lastFmTrack.title} ${lastFmTrack.artist}`;
      // Return the Promise without awaiting it
      return getYouTubeSong(searchQuery);
    });

    // 3. Use Promise.all to wait for ALL YouTube searches to complete simultaneously.
    const allYoutubeResults = await Promise.all(youtubeSearchPromises);

    // --- CONCURRENT FETCHING END ---

    // 4. Filter the results to only include successfully matched songs.
    const matchedYouTubeSongs: YouTubeSong[] = allYoutubeResults
      .filter((result): result is YouTubeSong => 'id' in result);

    return response.status(200).json(matchedYouTubeSongs);
  } catch (error) {
    // This catches errors from getSimilarTracks, Promise.all, or any unhandled exceptions
    console.error('Error in API handler:', error);
    return response.status(500).json({ error: 'Something went wrong' });
  }
}
