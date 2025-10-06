# Similar Music Backend

This project provides a backend service for discovering similar music, leveraging the YouTube and Last.fm APIs.

## Getting Started

### Prerequisites

* Node.js
* npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/similar-music.git
   cd similar-music
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

You will need API keys for YouTube and Last.fm. Create a `.env` file in the root directory of the project and add the following:

```
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
LASTFM_API_KEY=YOUR_LASTFM_API_KEY
```

### Running the Development Server

```bash
npm run dev
```

## Usage

The API exposes endpoints to search for tracks.

## API Endpoints

### `GET /api/tracks`

Search for tracks.

**Query Parameters:**
* `q`: Search query (e.g., "artist song title")