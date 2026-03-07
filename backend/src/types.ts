export type Platform = "APPLE_MUSIC" | "SPOTIFY";

export interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  APPLE_MUSIC_STOREFRONT?: string;
}

export interface ParsedSourceLink {
  sourceUrl: string;
  platform: Platform;
  trackId: string;
  storefront?: string;
}

export interface CanonicalTrack {
  platform: Platform;
  trackId: string;
  title: string;
  artist: string;
  isrc?: string;
  durationMs?: number;
  url: string;
  popularity?: number;
}

export interface CandidateTrack {
  trackId: string;
  title: string;
  artist: string;
  isrc?: string;
  durationMs?: number;
  url: string;
  popularity?: number;
}

export interface ConvertSuccess {
  sourcePlatform: Platform;
  targetPlatform: Platform;
  sourceTrackId: string;
  targetUrl: string;
  matchedBy: "ISRC" | "FUZZY" | "LINK_SERVICE";
  confidence: number;
}

export interface ErrorBody {
  errorCode: string;
  message: string;
}
