import { getSimilarTracks } from './api/lastfm_api.ts';
import { getYouTubeSong, type YouTubeSong } from './api/get_youtube_song.ts';

async function testModules() {
  console.log('Testing Last.fm API...');
  const lastFmApiKey = '';
  const lastFmQueryTitle = 'Iris';
  const lastFmQueryArtist = 'Goo Goo Dolls';
  const lastFmResult = await getSimilarTracks(lastFmQueryTitle, lastFmQueryArtist, lastFmApiKey);

  if ('error' in lastFmResult) {
    console.error('Last.fm API Error:', lastFmResult.error);
    return;
  }


  console.log('Last.fm Similar Tracks:', JSON.stringify(lastFmResult, null, 2));
  console.log('\nTesting YouTube Music Search API and matching logic...');
  const matchedYouTubeSongs: (YouTubeSong | null)[] = [];

  for (const lastFmTrack of lastFmResult) {
    const searchQuery = `${lastFmTrack.title} ${lastFmTrack.artist}`;

    const youtubeSong = await getYouTubeSong(searchQuery);

    if ('id' in youtubeSong) {
      matchedYouTubeSongs.push(youtubeSong as YouTubeSong);
    }
  }

  console.log('Matched YouTube Songs:', JSON.stringify(matchedYouTubeSongs, null, 2));
}

testModules();
