# Cloudflare Worker Backend

## Setup

1. Install dependencies:
   - `npm install`
2. Set Worker secrets (optional fallback path):
   - `wrangler secret put SPOTIFY_CLIENT_ID`
   - `wrangler secret put SPOTIFY_CLIENT_SECRET`
3. Run locally:
   - `npm run dev`

The primary conversion path uses Songlink and does not require Apple Developer or Spotify tokens.

## API

- `POST /convert`
- Input:
  - `{ "sourceUrl": "https://open.spotify.com/track/..." }`
- Output success:
  - `{ "sourcePlatform": "...", "targetPlatform": "...", "sourceTrackId": "...", "targetUrl": "...", "matchedBy": "...", "confidence": 0.95 }`
- Output failure:
  - `{ "errorCode": "NO_MATCH", "message": "No track match was found." }`
