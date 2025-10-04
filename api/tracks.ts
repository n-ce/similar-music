import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSimilarTracks, LastFmTrack } from './lastfm_api';
import { getYouTubeSongs, YouTubeSong } from './get_youtube_songs';

function parseDuration(duration: string | undefined): number | null {
  if (!duration) return null;
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return null;
}

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

    const similarTracks = lastFmData.similartracks.track;

    const youtubeSearchPromises = similarTracks.map(async (lastFmTrack: LastFmTrack) => {
      const searchQuery = `${lastFmTrack.name} ${lastFmTrack.artist.name}`;
      const youtubeSongs = await getYouTubeSongs(searchQuery);

      if (youtubeSongs.length === 0) {
        return null;
      }

      const lastFmDuration = lastFmTrack.duration ? Number(lastFmTrack.duration) : null;

      // Try to find an exact match based on title, artist, and duration
      const exactMatch = youtubeSongs.find(ytSong => {
        const ytDuration = parseDuration(ytSong.duration);
        const titleMatch = ytSong.title?.toLowerCase() === lastFmTrack.name.toLowerCase();
        const artistMatch = ytSong.author?.toLowerCase() === lastFmTrack.artist.name.toLowerCase();
        const durationMatch = lastFmDuration && ytDuration && Math.abs(lastFmDuration - ytDuration) <= 5; // Allow a 5-second difference

        return titleMatch && artistMatch && durationMatch;
      });

      const selectedSong = exactMatch || youtubeSongs[0];

      return {
        ...selectedSong,
        author: selectedSong.author ? `${selectedSong.author} - Topic` : undefined,
      };
    });

    const youtubeResults = await Promise.all(youtubeSearchPromises);
    const filteredResults = youtubeResults.filter(result => result !== null);

    return response.status(200).json(filteredResults);
  } catch (error) {
    console.error('Error in API handler:', error);
    return response.status(500).json({ error: 'Something went wrong' });
  }
}