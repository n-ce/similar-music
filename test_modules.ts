
import { getSimilarTracks } from './api/lastfm_api';
import { getYouTubeSongs } from './api/get_youtube_songs';

async function testModules() {
  // Test Last.fm API
  console.log('Testing Last.fm API...');
  const lastFmApiKey = process.env.LASTFM_API_KEY || 'YOUR_LASTFM_API_KEY'; // Replace with your actual API key or set as env var
  const similarTracks = await getSimilarTracks('Iris', 'Goo Goo Dolls', lastFmApiKey);
  console.log('Last.fm Similar Tracks:', JSON.stringify(similarTracks, null, 2));

  // Test YouTube Music Search API
  console.log('\nTesting YouTube Music Search API...');
  const youtubeSongs = await getYouTubeSongs('Iris Goo Goo Dolls');
  console.log('YouTube Songs:', JSON.stringify(youtubeSongs, null, 2));
}

testModules();
