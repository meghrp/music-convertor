import { AppError } from "../errors";
import type { CandidateTrack, CanonicalTrack, Env } from "../types";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | undefined;

export async function getSpotifyTrack(env: Env, trackId: string): Promise<CanonicalTrack> {
  const token = await getSpotifyToken(env);
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new AppError("PROVIDER_ERROR", "Spotify track lookup failed.", 502);
  }

  const data = (await response.json()) as any;
  return {
    platform: "SPOTIFY",
    trackId: data.id,
    title: data.name,
    artist: data.artists?.[0]?.name ?? "",
    isrc: data.external_ids?.isrc,
    durationMs: data.duration_ms,
    url: data.external_urls?.spotify ?? `https://open.spotify.com/track/${data.id}`,
    popularity: data.popularity
  };
}

export async function searchSpotifyCandidates(env: Env, source: CanonicalTrack): Promise<CandidateTrack[]> {
  const token = await getSpotifyToken(env);
  const urls: string[] = [];

  if (source.isrc) {
    urls.push(`https://api.spotify.com/v1/search?type=track&limit=5&q=${encodeURIComponent(`isrc:${source.isrc}`)}`);
  }
  urls.push(
    `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(`track:${source.title} artist:${source.artist}`)}`
  );

  const candidates: CandidateTrack[] = [];
  for (const url of urls) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      continue;
    }
    const payload = (await response.json()) as any;
    for (const item of payload.tracks?.items ?? []) {
      candidates.push({
        trackId: item.id,
        title: item.name,
        artist: item.artists?.[0]?.name ?? "",
        isrc: item.external_ids?.isrc,
        durationMs: item.duration_ms,
        popularity: item.popularity,
        url: item.external_urls?.spotify ?? `https://open.spotify.com/track/${item.id}`
      });
    }
  }
  return uniqueByTrackId(candidates);
}

async function getSpotifyToken(env: Env): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 10_000) {
    return cachedToken.token;
  }

  const basicAuth = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    throw new AppError("PROVIDER_ERROR", "Spotify auth failed.", 502);
  }
  const payload = (await response.json()) as any;
  cachedToken = {
    token: payload.access_token,
    expiresAt: now + (payload.expires_in ?? 3600) * 1000
  };
  return cachedToken.token;
}

function uniqueByTrackId(candidates: CandidateTrack[]): CandidateTrack[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.trackId)) {
      return false;
    }
    seen.add(candidate.trackId);
    return true;
  });
}

export function resetSpotifyTokenCacheForTest(): void {
  cachedToken = undefined;
}
