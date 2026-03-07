# Architecture Overview

## Components

- iMessage Extension UI for paste/convert/copy.
- Cloudflare Worker API for provider lookups and track matching.
- Apple Music API adapter and Spotify Web API adapter.

## v1 Scope

- Track links only.
- Bi-directional conversion (Apple Music <-> Spotify).
- Manual message send after copy.
