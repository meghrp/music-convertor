import { AppError } from "../errors";
import type { CandidateTrack, CanonicalTrack, Env } from "../types";

export async function getAppleTrack(env: Env, trackId: string, storefront = "us"): Promise<CanonicalTrack> {
  const url = `https://api.music.apple.com/v1/catalog/${storefront}/songs/${trackId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${env.APPLE_MUSIC_DEVELOPER_TOKEN}` }
  });
  if (!response.ok) {
    throw new AppError("PROVIDER_ERROR", "Apple Music track lookup failed.", 502);
  }
  const payload = (await response.json()) as any;
  const song = payload.data?.[0];
  if (!song) {
    throw new AppError("NO_MATCH", "Apple Music track not found.", 404);
  }

  return {
    platform: "APPLE_MUSIC",
    trackId: song.id,
    title: song.attributes?.name ?? "",
    artist: song.attributes?.artistName ?? "",
    isrc: song.attributes?.isrc,
    durationMs: song.attributes?.durationInMillis,
    url: song.attributes?.url ?? `https://music.apple.com/${storefront}/song/${song.id}`
  };
}

export async function searchAppleCandidates(env: Env, source: CanonicalTrack, storefront = "us"): Promise<CandidateTrack[]> {
  const headers = { Authorization: `Bearer ${env.APPLE_MUSIC_DEVELOPER_TOKEN}` };
  const candidates: CandidateTrack[] = [];

  if (source.isrc) {
    const byIsrcUrl = `https://api.music.apple.com/v1/catalog/${storefront}/songs?filter[isrc]=${encodeURIComponent(source.isrc)}`;
    const byIsrcResponse = await fetch(byIsrcUrl, { headers });
    if (byIsrcResponse.ok) {
      const byIsrcPayload = (await byIsrcResponse.json()) as any;
      candidates.push(...mapSongs(byIsrcPayload.data ?? []));
    }
  }

  const term = encodeURIComponent(`${source.title} ${source.artist}`);
  const searchUrl = `https://api.music.apple.com/v1/catalog/${storefront}/search?types=songs&limit=10&term=${term}`;
  const searchResponse = await fetch(searchUrl, { headers });
  if (searchResponse.ok) {
    const searchPayload = (await searchResponse.json()) as any;
    candidates.push(...mapSongs(searchPayload.results?.songs?.data ?? []));
  }

  return uniqueByTrackId(candidates);
}

function mapSongs(items: any[]): CandidateTrack[] {
  return items.map((song) => ({
    trackId: song.id,
    title: song.attributes?.name ?? "",
    artist: song.attributes?.artistName ?? "",
    isrc: song.attributes?.isrc,
    durationMs: song.attributes?.durationInMillis,
    url: song.attributes?.url ?? ""
  }));
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
