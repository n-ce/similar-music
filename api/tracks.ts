
import type { VercelRequest, VercelResponse } from '@vercel/node';
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

  const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${artist}&track=${title}&api_key=${apiKey}&format=json`;

  try {
    const lastFmResponse = await fetch(lastFmUrl);
    const lastFmData = await lastFmResponse.json();

    if (lastFmData.error) {
      return response.status(500).json({ error: lastFmData.message });
    }

    const similarTracks = lastFmData.similartracks.track;

    const youtubeSearchPromises = similarTracks.map(async (lastFmTrack: any) => {
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

      if (exactMatch) {
        return exactMatch;
      }

      // Fallback to the first result if no exact match is found
      return youtubeSongs[0];
    });

    const youtubeResults = await Promise.all(youtubeSearchPromises);
    const filteredResults = youtubeResults.filter(result => result !== null);

    return response.status(200).json(filteredResults);
  } catch (error) {
    console.error('Error in API handler:', error);
    return response.status(500).json({ error: 'Something went wrong' });
  }
}
