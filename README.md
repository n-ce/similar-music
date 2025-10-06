# Similar Music Backend

This project provides a backend service for discovering similar music, leveraging the Last.fm API.

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

You will need an API key for Last.fm. Create a `.env` file in the root directory of the project and add the following:

```
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
* `title`: (Required) The title of the track to search for.
* `artist`: (Required) The artist of the track to search for.
* `limit`: (Optional) The maximum number of tracks to return. Defaults to 5 if not provided.
