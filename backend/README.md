# Cloudflare Worker Backend

## Setup

1. Install dependencies:
   - `npm install`
2. Set Worker secrets:
   - `wrangler secret put SPOTIFY_CLIENT_ID`
   - `wrangler secret put SPOTIFY_CLIENT_SECRET`
   - `wrangler secret put APPLE_MUSIC_DEVELOPER_TOKEN`
3. Run locally:
   - `npm run dev`

## API

- `POST /convert`
- Input:
  - `{ "sourceUrl": "https://open.spotify.com/track/..." }`
- Output success:
  - `{ "sourcePlatform": "...", "targetPlatform": "...", "sourceTrackId": "...", "targetUrl": "...", "matchedBy": "...", "confidence": 0.95 }`
- Output failure:
  - `{ "errorCode": "NO_MATCH", "message": "No track match was found." }`
