import { AppError } from "../errors";
import type { Platform } from "../types";

type SongLinkPlatform = "spotify" | "appleMusic";

interface SongLinkResponse {
  linksByPlatform?: Record<string, { url?: string }>;
}

export async function resolveViaSongLink(sourceUrl: string, targetPlatform: Platform): Promise<string> {
  const url = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(sourceUrl)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError("PROVIDER_ERROR", "Songlink lookup failed.", 502);
  }

  const payload = (await response.json()) as SongLinkResponse;
  const platformKey: SongLinkPlatform = targetPlatform === "SPOTIFY" ? "spotify" : "appleMusic";
  const targetUrl = payload.linksByPlatform?.[platformKey]?.url;
  if (!targetUrl) {
    throw new AppError("NO_MATCH", "Songlink did not return a target URL.", 404);
  }
  return targetUrl;
}
