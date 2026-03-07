import { AppError } from "./errors";
import type { ParsedSourceLink } from "./types";

export function parseSourceLink(sourceUrl: string): ParsedSourceLink {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    throw new AppError("UNSUPPORTED_LINK_TYPE", "Invalid URL format.", 400);
  }

  const host = url.hostname.toLowerCase();
  if (host.includes("spotify.com")) {
    return parseSpotify(url);
  }
  if (host.includes("music.apple.com")) {
    return parseApple(url);
  }
  throw new AppError("UNSUPPORTED_LINK_TYPE", "Only Spotify and Apple Music URLs are supported.", 400);
}

function parseSpotify(url: URL): ParsedSourceLink {
  const path = url.pathname.split("/").filter(Boolean);
  if (path[0] !== "track" || !path[1]) {
    throw new AppError("UNSUPPORTED_LINK_TYPE", "Only Spotify track links are supported.", 400);
  }

  return {
    sourceUrl: url.toString(),
    platform: "SPOTIFY",
    trackId: path[1]
  };
}

function parseApple(url: URL): ParsedSourceLink {
  const path = url.pathname.split("/").filter(Boolean);
  const storefront = path[0] ?? "us";
  const queryTrack = url.searchParams.get("i");
  if (queryTrack) {
    return {
      sourceUrl: url.toString(),
      platform: "APPLE_MUSIC",
      trackId: queryTrack,
      storefront
    };
  }

  const secondLast = path[path.length - 2];
  if (secondLast !== "song") {
    throw new AppError("UNSUPPORTED_LINK_TYPE", "Only Apple Music song links are supported.", 400);
  }

  const fallbackTrack = path[path.length - 1];
  const trackId = fallbackTrack;
  if (!trackId) {
    throw new AppError("UNSUPPORTED_LINK_TYPE", "Could not resolve Apple Music track ID.", 400);
  }

  return {
    sourceUrl: url.toString(),
    platform: "APPLE_MUSIC",
    trackId,
    storefront
  };
}
