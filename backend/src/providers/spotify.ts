import { AppError } from "../errors";
import type { CandidateTrack, CanonicalTrack, Env } from "../types";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | undefined;

export async function getSpotifyTrack(env: Env, trackId: string): Promise<CanonicalTrack> {
  const token = await getSpotifyToken(env);
  const market = normalizeSpotifyMarket(env.APPLE_MUSIC_STOREFRONT);
  const trackUrl = new URL(`https://api.spotify.com/v1/tracks/${trackId}`);
  if (market) {
    trackUrl.searchParams.set("market", market);
  }
  const response = await fetch(trackUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const fallback = await getSpotifyTrackFromOpenGraph(trackId);
    if (fallback) {
      return fallback;
    }
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

function normalizeSpotifyMarket(storefront?: string): string | undefined {
  if (!storefront) {
    return undefined;
  }
  const trimmed = storefront.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

async function getSpotifyTrackFromOpenGraph(trackId: string): Promise<CanonicalTrack | null> {
  const response = await fetch(`https://open.spotify.com/track/${encodeURIComponent(trackId)}`);
  if (!response.ok) {
    return null;
  }
  const html = await response.text();
  const title = extractMeta(html, "property", "og:title") ?? extractMeta(html, "name", "twitter:title");
  const artist =
    extractMeta(html, "name", "music:musician_description") ?? extractArtistFromDescription(extractMeta(html, "property", "og:description"));
  const durationSeconds = Number(extractMeta(html, "name", "music:duration"));
  if (!title || !artist) {
    return null;
  }
  return {
    platform: "SPOTIFY",
    trackId,
    title,
    artist,
    durationMs: Number.isFinite(durationSeconds) && durationSeconds > 0 ? Math.round(durationSeconds * 1000) : undefined,
    url: `https://open.spotify.com/track/${trackId}`
  };
}

function extractArtistFromDescription(description?: string): string | undefined {
  if (!description) {
    return undefined;
  }
  const [artist] = description.split("·");
  const normalized = artist?.trim();
  return normalized || undefined;
}

function extractMeta(html: string, attrName: "property" | "name", attrValue: string): string | undefined {
  const escaped = escapeRegex(attrValue);
  const contentFirstPattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${attrName}=["']${escaped}["'][^>]*>`,
    "i"
  );
  const attrFirstPattern = new RegExp(
    `<meta[^>]*${attrName}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i"
  );

  const contentFirstMatch = html.match(contentFirstPattern);
  if (contentFirstMatch?.[1]) {
    return decodeHtmlEntity(contentFirstMatch[1].trim());
  }
  const attrFirstMatch = html.match(attrFirstPattern);
  if (attrFirstMatch?.[1]) {
    return decodeHtmlEntity(attrFirstMatch[1].trim());
  }
  return undefined;
}

function decodeHtmlEntity(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
