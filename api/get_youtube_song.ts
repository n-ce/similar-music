const YOUTUBE_MUSIC_SEARCH_URL = 'https://music.youtube.com/youtubei/v1/search';


export interface YouTubeSong {
  id: string,
  title: string,
  author: string,
  duration: string,
  channelUrl: string
}


export async function getYouTubeSong(query: string): Promise<YouTubeSong | {}> {
  const requestBody = {
    context: {
      client: {
        clientName: 'WEB_REMIX',
        clientVersion: '1.20250929.03.00',
      }
    },
    query: query,
  };


  try {
    const response = await fetch(YOUTUBE_MUSIC_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return {};
    }

    const data = await response.json();

    const contents = data.contents?.tabbedSearchResultsRenderer?.tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
    const searchList = contents?.[1]?.musicShelfRenderer?.contents || [];

    for (const item of searchList) {

      const flexColumns = item.musicResponsiveListItemRenderer?.flexColumns;
      if (!flexColumns || flexColumns.length < 2) continue;

      const titleRun = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0];
      const title = titleRun?.text;
      const id = titleRun?.navigationEndpoint?.watchEndpoint?.videoId;

      if (!id) continue;

      const metadataRuns = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
      if (!metadataRuns) continue;

      const artistRun = metadataRuns.find((run: any) => run.navigationEndpoint?.browseEndpoint?.browseId);
      const author = artistRun?.text;
      const channelId = artistRun?.navigationEndpoint?.browseEndpoint?.browseId;
      const duration = metadataRuns[4].text || '00:00';



      return {
        id,
        title,
        author: author + ' - Topic',
        duration,
        channelUrl: 'channel/' + channelId
      };
    }


    return {};

  } catch (error) {
    console.error('Error fetching YouTube Music search results:', error);
    return {};
  }
}
