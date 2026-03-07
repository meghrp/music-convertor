import { AppError } from "../errors";
import type { CandidateTrack, CanonicalTrack } from "../types";

export async function getAppleTrack(trackId: string, storefront = "us"): Promise<CanonicalTrack> {
  const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}&entity=song&country=${encodeURIComponent(storefront)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError("PROVIDER_ERROR", "iTunes track lookup failed.", 502);
  }
  const payload = (await response.json()) as any;
  const song = (payload.results ?? []).find((item: any) => item.kind === "song" || item.wrapperType === "track");
  if (!song) {
    throw new AppError("NO_MATCH", "Apple track not found via iTunes lookup.", 404);
  }

  return {
    platform: "APPLE_MUSIC",
    trackId: String(song.trackId ?? trackId),
    title: song.trackName ?? "",
    artist: song.artistName ?? "",
    isrc: song.isrc,
    durationMs: song.trackTimeMillis,
    url: song.trackViewUrl ?? `https://music.apple.com/${storefront}/song/${song.trackId ?? trackId}`
  };
}

export async function searchAppleCandidates(source: CanonicalTrack, storefront = "us"): Promise<CandidateTrack[]> {
  const candidates: CandidateTrack[] = [];

  if (source.isrc) {
    const byIsrcUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(source.isrc)}&entity=song&limit=10&country=${encodeURIComponent(storefront)}`;
    const byIsrcResponse = await fetch(byIsrcUrl);
    if (byIsrcResponse.ok) {
      const byIsrcPayload = (await byIsrcResponse.json()) as any;
      candidates.push(...mapSongs(byIsrcPayload.results ?? []));
    }
  }

  const term = encodeURIComponent(`${source.title} ${source.artist}`);
  const searchUrl = `https://itunes.apple.com/search?term=${term}&entity=song&limit=20&country=${encodeURIComponent(storefront)}`;
  const searchResponse = await fetch(searchUrl);
  if (searchResponse.ok) {
    const searchPayload = (await searchResponse.json()) as any;
    candidates.push(...mapSongs(searchPayload.results ?? []));
  }

  return uniqueByTrackId(candidates);
}

function mapSongs(items: any[]): CandidateTrack[] {
  return items.map((song) => ({
    trackId: String(song.trackId ?? ""),
    title: song.trackName ?? "",
    artist: song.artistName ?? "",
    isrc: song.isrc,
    durationMs: song.trackTimeMillis,
    url: song.trackViewUrl ?? ""
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
