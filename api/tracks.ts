import type { VercelRequest, VercelResponse } from '@vercel/node';

const YOUTUBE_MUSIC_SEARCH_URL = 'https://music.youtube.com/youtubei/v1/search';

interface YouTubeMusicSearchResponse {
  contents: {
    tabbedSearchResultsRenderer: {
      tabs: {
        tabRenderer: {
          content: {
            sectionListRenderer: {
              contents: {
                musicShelfRenderer: {
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
                };
              }[];
            };
          };
        };
      }[];
    };
  };
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

    const youtubeSearchPromises = similarTracks.map((track: any) => {
      const searchQuery = `${track.name} ${track.artist.name}`;
      const requestBody = {
        context: {
          client: {
            clientName: 'WEB_REMIX',
            clientVersion: '1.20251001.01.00',
          },
        },
        query: searchQuery,
      };

      return fetch(YOUTUBE_MUSIC_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then((res) => res.json())
        .then((data: YouTubeMusicSearchResponse) => {
          const songsShelf = data.contents?.tabbedSearchResultsRenderer?.tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents.find(shelf => shelf.musicShelfRenderer && shelf.musicShelfRenderer.title.runs[0].text === 'Songs');
          const firstResult = songsShelf?.musicShelfRenderer?.contents[0]?.musicResponsiveListItemRenderer;
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
            channelUrl: channelUrl ? `/channel/${channelUrl}`: undefined,
          };
        });
    });

    const youtubeResults = await Promise.all(youtubeSearchPromises);
    const filteredResults = youtubeResults.filter(result => result !== null);

    return response.status(200).json(filteredResults);
  } catch (error) {
    return response.status(500).json({ error: 'Something went wrong' });
  }
}