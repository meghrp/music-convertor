# Music Converter

Greenfield project for converting Apple Music track links to Spotify and Spotify track links to Apple Music.

## Repository Layout

- `ios/` iOS container app and iMessage extension.
- `backend/` Cloudflare Worker conversion API.
- `docs/` implementation and architecture notes.

## Getting Started

1. Build and run the iOS project from `ios/`.
2. Configure backend secrets and run Worker from `backend/`.
3. Point the iMessage extension config at your deployed Worker URL.

Detailed setup is documented in `docs/`.
