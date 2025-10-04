
export interface LastFmTrack {
  name: string;
  artist: { name: string };
  url: string;
  duration: string;
  playcount: number;
  match: number;
  image: { '#text': string; size: string }[];
}

export interface LastFmSimilarTracksResponse {
  similartracks: {
    track: LastFmTrack[];
    '@attr': { artist: string; 'mbid': string; page: string; perPage: string; totalPages: string; total: string };
  };
}

export async function getSimilarTracks(title: string, artist: string, apiKey: string): Promise<LastFmSimilarTracksResponse | { error: string }> {
  const url = `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${artist}&track=${title}&api_key=${apiKey}&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return { error: data.message };
    }

    return data as LastFmSimilarTracksResponse;
  } catch (error) {
    console.error('Error fetching Last.fm similar tracks:', error);
    return { error: 'Failed to fetch similar tracks from Last.fm' };
  }
}
