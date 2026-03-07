import { AppError } from "./errors";
import { parseSourceLink } from "./linkParser";
import { matchCandidate } from "./matcher";
import { getAppleTrack, searchAppleCandidates } from "./providers/appleMusic";
import { getSpotifyTrack, searchSpotifyCandidates } from "./providers/spotify";
import type { ConvertSuccess, Env, ErrorBody } from "./types";

interface ConvertRequestBody {
  sourceUrl?: string;
}

interface RateWindow {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const rateWindows = new Map<string, RateWindow>();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const start = Date.now();
    try {
      if (request.method === "OPTIONS") {
        return cors(new Response(null, { status: 204 }));
      }
      if (request.method !== "POST" || new URL(request.url).pathname !== "/convert") {
        return cors(json({ errorCode: "NOT_FOUND", message: "Route not found." }, 404));
      }

      enforceRateLimit(request);
      const body = (await request.json()) as ConvertRequestBody;
      if (!body.sourceUrl) {
        throw new AppError("UNSUPPORTED_LINK_TYPE", "Missing sourceUrl in request.", 400);
      }

      const parsed = parseSourceLink(body.sourceUrl);
      const storefront = parsed.storefront ?? env.APPLE_MUSIC_STOREFRONT ?? "us";

      const result =
        parsed.platform === "SPOTIFY"
          ? await convertSpotifyToApple(env, parsed.trackId, storefront)
          : await convertAppleToSpotify(env, parsed.trackId, storefront);

      logEvent("convert_success", {
        sourcePlatform: result.sourcePlatform,
        targetPlatform: result.targetPlatform,
        matchedBy: result.matchedBy,
        confidence: result.confidence,
        latencyMs: Date.now() - start
      });
      return cors(json(result, 200));
    } catch (error) {
      const appError = normalizeError(error);
      logEvent("convert_failure", {
        errorCode: appError.errorCode,
        statusCode: appError.statusCode,
        message: appError.message,
        latencyMs: Date.now() - start
      });
      const body: ErrorBody = { errorCode: appError.errorCode, message: appError.message };
      return cors(json(body, appError.statusCode));
    }
  }
};

async function convertSpotifyToApple(env: Env, trackId: string, storefront: string): Promise<ConvertSuccess> {
  const source = await getSpotifyTrack(env, trackId);
  const candidates = await searchAppleCandidates(env, source, storefront);
  const match = matchCandidate(source, candidates);
  return {
    sourcePlatform: "SPOTIFY",
    targetPlatform: "APPLE_MUSIC",
    sourceTrackId: trackId,
    targetUrl: match.target.url,
    matchedBy: match.matchedBy,
    confidence: match.confidence
  };
}

async function convertAppleToSpotify(env: Env, trackId: string, storefront: string): Promise<ConvertSuccess> {
  const source = await getAppleTrack(env, trackId, storefront);
  const candidates = await searchSpotifyCandidates(env, source);
  const match = matchCandidate(source, candidates);
  return {
    sourcePlatform: "APPLE_MUSIC",
    targetPlatform: "SPOTIFY",
    sourceTrackId: trackId,
    targetUrl: match.target.url,
    matchedBy: match.matchedBy,
    confidence: match.confidence
  };
}

function enforceRateLimit(request: Request): void {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const now = Date.now();
  const record = rateWindows.get(ip);
  if (!record || now - record.windowStart >= WINDOW_MS) {
    rateWindows.set(ip, { count: 1, windowStart: now });
    return;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    throw new AppError("RATE_LIMITED", "Rate limit exceeded. Try again soon.", 429);
  }
  record.count += 1;
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  return new AppError("PROVIDER_ERROR", "Unexpected server error.", 500);
}

function logEvent(event: string, data: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      event,
      ...data,
      timestamp: new Date().toISOString()
    })
  );
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function cors(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
