import { getSimilarTracks, type SimplifiedTrack } from './api/lastfm_api.ts';
import { getYouTubeSong, type YouTubeSong } from './api/get_youtube_song.ts';

async function testModules() {
  console.log('Testing Last.fm API...');

  // NOTE: You must fill in your actual Last.fm API Key here
  const lastFmApiKey = '0867bcb6f36c879398969db682a7b69b';
  const lastFmQueryTitle = 'Iris';
  const lastFmQueryArtist = 'Goo Goo Dolls';

  // --- STEP 1: Fetch Similar Tracks (Sequential, as it's the first step) ---
  const lastFmResult = await getSimilarTracks(lastFmQueryTitle, lastFmQueryArtist, lastFmApiKey, '10');

  if ('error' in lastFmResult) {
    console.error('Last.fm API Error:', lastFmResult.error);
    return;
  }

  console.log('Last.fm Similar Tracks fetched successfully.');
  console.log(`Found ${lastFmResult.length} similar tracks.`);
  console.log('\nStarting Concurrent YouTube Music Search API and matching logic...');

  // --- STEP 2: Initiate Concurrent YouTube Song Fetching using Promise.all ---

  // 1. Create an array of Promises for the YouTube API calls.
  // The .map() method immediately starts the getYouTubeSong function for every track 
  // without waiting for the previous one to complete, returning an array of Promises.
  const youtubeSearchPromises = lastFmResult.map(async (lastFmTrack: SimplifiedTrack) => {
    const searchQuery = `${lastFmTrack.title} ${lastFmTrack.artist}`;

    // Return the promise from getYouTubeSong
    return getYouTubeSong(searchQuery);
  });

  // 2. Await all promises to resolve concurrently.
  // Execution pauses here until ALL the YouTube search requests have finished.
  const allYoutubeResults = await Promise.all(youtubeSearchPromises);

  // --- STEP 3: Process and Filter Results ---

  // 3. Filter the results to get only the successfully matched songs 
  // (which are objects containing an 'id' property).
  const matchedYouTubeSongs: YouTubeSong[] = allYoutubeResults
    .filter((result): result is YouTubeSong => 'id' in result);

  console.log(`\nConcurrent fetching complete. Found ${matchedYouTubeSongs.length} matched YouTube songs.`);
  console.log('Matched YouTube Songs:', JSON.stringify(matchedYouTubeSongs, null, 2));
}

testModules();
