const YOUTUBE_MUSIC_SEARCH_URL = 'https://music.youtube.com/youtubei/v1/search';

interface MusicShelfRenderer {
  title: {
    runs: {
      text: string;
    }[];
  };
  contents: {
    musicResponsiveListItemRenderer: {
      flexColumns: {
        musicResponsiveListItemFlexColumnRenderer: {
          text: {
            runs: {
              text: string;
              navigationEndpoint?: {
                watchEndpoint?: {
                  videoId: string;
                };
                browseEndpoint?: {
                  browseId: string;
                };
              };
            }[];
          };
        };
      }[];
      thumbnail: {
        musicThumbnailRenderer: {
          thumbnail: {
            thumbnails: {
              url: string;
              width: number;
              height: number;
            }[];
          };
        };
      };
    };
  }[];
}

interface MusicCardShelfRenderer {
  // empty for now
}

interface Shelf {
  musicShelfRenderer?: MusicShelfRenderer;
  musicCardShelfRenderer?: MusicCardShelfRenderer;
}

function isMusicShelfRenderer(shelf: Shelf): shelf is { musicShelfRenderer: MusicShelfRenderer } {
  return shelf.musicShelfRenderer !== undefined;
}

interface YouTubeMusicSearchResponse {
  contents: {
    tabbedSearchResultsRenderer: {
      tabs: {
        tabRenderer: {
          content: {
            sectionListRenderer: {
              contents: Shelf[];
            };
          };
        };
      }[];
    };
  };
}

export interface YouTubeSong {
  id: string | undefined;
  title: string | undefined;
  author: string | undefined;
  duration: string | undefined;
  channelUrl: string | undefined;
}

export async function getYouTubeSongs(query: string): Promise<YouTubeSong[]> {
  const requestBody = {
    context: {
      client: {
        clientName: 'WEB_REMIX',
        clientVersion: '1.20251001.01.00',
      },
    },
    query: query,
  };

  try {
    const response = await fetch(YOUTUBE_MUSIC_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data: YouTubeMusicSearchResponse = await response.json();

    const songsShelf = data.contents?.tabbedSearchResultsRenderer?.tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents.find(shelf => {
            if (shelf.musicShelfRenderer) {
                return shelf.musicShelfRenderer.title?.runs[0]?.text === 'Songs';
            }
            return false;
          });

    if (!songsShelf) {
      return [];
    }

    const youtubeSongs: YouTubeSong[] = songsShelf.musicShelfRenderer.contents.map((item: any) => {
      const firstResult = item.musicResponsiveListItemRenderer;
      if (!firstResult) {
        return null;
      }
      const videoId = firstResult.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].navigationEndpoint?.watchEndpoint?.videoId;
      const title = firstResult.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
      const author = firstResult.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
      const duration = firstResult.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs.slice(-1)[0].text;
      const channelUrl = firstResult.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].navigationEndpoint?.browseEndpoint?.browseId;

      return {
        id: videoId,
        title,
        author,
        duration,
        channelUrl: channelUrl ? `/channel/${channelUrl}` : undefined,
      };
    }).filter(song => song !== null);

    return youtubeSongs;
  } catch (error) {
    console.error('Error fetching YouTube Music search results:', error);
    return [];
  }
}