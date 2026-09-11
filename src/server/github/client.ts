/**
 * The GitHub client.
 *
 * Architecture rule 1: this is the only module that knows how to talk to
 * GitHub. Everything above it receives collected data.
 *
 * It is deliberately small — `fetch` plus rate-limit accounting, backoff and a
 * short-lived response cache. GitHub is treated as expensive: every call is
 * cached, secondary-rate-limit responses are respected rather than retried in a
 * tight loop, and a request that would exhaust the remaining budget is refused.
 */

import { backgroundGithubToken } from "@/config/env";

const REST_BASE = "https://api.github.com";
const GRAPHQL_URL = "https://api.github.com/graphql";
const USER_AGENT = "tracer (+https://github.com/tracer)";

/** Requests are refused below this to leave room for user-facing traffic. */
const RESERVED_REQUESTS = 50;

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export class RateLimitError extends GitHubError {
  constructor(
    message: string,
    readonly resetAt: Date,
    url: string,
  ) {
    super(message, 429, url);
    this.name = "RateLimitError";
  }
}

export interface RateLimitState {
  limit: number;
  remaining: number;
  resetAt: Date | null;
}

interface CacheEntry {
  expiresAt: number;
  /** Kept so conditional requests do not spend rate-limit budget. */
  etag: string | null;
  body: unknown;
}

const responseCache = new Map<string, CacheEntry>();

/** Default cache lifetime. Individual calls can ask for something different. */
const DEFAULT_TTL_SECONDS = 300;

export interface GitHubClientOptions {
  /**
   * A user's OAuth token where one is available — it carries that user's own
   * 5,000 requests per hour. Falls back to `GITHUB_TOKEN` for background jobs.
   */
  token?: string | null;
}

export interface RequestOptions {
  /** Seconds to cache a successful response. 0 disables caching. */
  cacheSeconds?: number;
  /** A 404 is an expected answer for some lookups (no CONTRIBUTING.md, say). */
  allowNotFound?: boolean;
  searchParams?: Record<string, string | number | undefined>;
}

export class GitHubClient {
  private readonly token: string | null;
  private rateLimit: RateLimitState = { limit: 5000, remaining: 5000, resetAt: null };

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token ?? backgroundGithubToken();
  }

  /** What is left of the hourly budget, as of the last response. */
  getRateLimit(): RateLimitState {
    return { ...this.rateLimit };
  }

  /**
   * A single REST GET. Returns `null` for an allowed 404.
   *
   * Never scrapes: if there is no API endpoint for something, we do without it
   * (spec section 5).
   */
  async rest<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
    const url = new URL(path.startsWith("http") ? path : `${REST_BASE}${path}`);
    for (const [key, value] of Object.entries(options.searchParams ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return this.request<T>(url.toString(), { method: "GET" }, options);
  }

  /**
   * Fetches up to `max` items across pages. GitHub caps `per_page` at 100, and
   * we cap the number of pages so one pathological repository cannot spend the
   * whole budget.
   */
  async restPaginated<T>(
    path: string,
    options: RequestOptions & { max?: number } = {},
  ): Promise<T[]> {
    const max = options.max ?? 100;
    const perPage = Math.min(100, max);
    const results: T[] = [];

    for (let page = 1; results.length < max; page += 1) {
      const batch = await this.rest<T[]>(path, {
        ...options,
        searchParams: { ...options.searchParams, per_page: perPage, page },
      });
      if (!batch || batch.length === 0) break;
      results.push(...batch);
      if (batch.length < perPage) break;
      // 10 pages of anything is more than enough signal.
      if (page >= 10) break;
    }

    return results.slice(0, max);
  }

  /** GraphQL, used where it saves round trips (issue plus comments plus PRs). */
  async graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
    const body = JSON.stringify({ query, variables });
    const result = await this.request<{ data: T; errors?: { message: string }[] }>(
      GRAPHQL_URL,
      { method: "POST", body },
      { cacheSeconds: 0 },
    );
    if (!result) return null;
    if (result.errors?.length) {
      throw new GitHubError(result.errors.map((e) => e.message).join("; "), 400, GRAPHQL_URL);
    }
    return result.data;
  }

  private async request<T>(
    url: string,
    init: RequestInit,
    options: RequestOptions,
  ): Promise<T | null> {
    const cacheable = init.method === "GET" && options.cacheSeconds !== 0;
    const cacheKey = `${this.token ? "u" : "a"}:${url}`;
    const cached = cacheable ? responseCache.get(cacheKey) : undefined;

    if (cached && cached.expiresAt > Date.now()) {
      return cached.body as T;
    }

    this.assertBudget(url);

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": USER_AGENT,
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (init.body) headers["Content-Type"] = "application/json";
    // A revalidated response does not count against the rate limit.
    if (cached?.etag) headers["If-None-Match"] = cached.etag;

    const response = await this.send(url, { ...init, headers });
    this.readRateLimit(response);

    if (response.status === 304 && cached) {
      cached.expiresAt = Date.now() + (options.cacheSeconds ?? DEFAULT_TTL_SECONDS) * 1000;
      return cached.body as T;
    }

    if (response.status === 404 && options.allowNotFound) return null;

    if (!response.ok) {
      throw new GitHubError(
        `GitHub responded ${response.status}: ${await safeText(response)}`,
        response.status,
        url,
      );
    }

    const body = (await response.json()) as T;

    if (cacheable) {
      responseCache.set(cacheKey, {
        expiresAt: Date.now() + (options.cacheSeconds ?? DEFAULT_TTL_SECONDS) * 1000,
        etag: response.headers.get("etag"),
        body,
      });
    }

    return body;
  }

  /**
   * Sends the request, retrying once on a secondary rate limit or a 5xx.
   * Primary rate-limit exhaustion is not retried — it is reported, because the
   * reset is up to an hour away and the caller should degrade instead of wait.
   */
  private async send(url: string, init: RequestInit, attempt = 0): Promise<Response> {
    const response = await fetch(url, { ...init, cache: "no-store" });

    if (response.status === 403 || response.status === 429) {
      const remaining = Number(response.headers.get("x-ratelimit-remaining") ?? "1");
      if (remaining === 0) {
        this.readRateLimit(response);
        throw new RateLimitError(
          "GitHub rate limit exhausted",
          this.rateLimit.resetAt ?? new Date(Date.now() + 60_000),
          url,
        );
      }

      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      if (retryAfter > 0 && retryAfter <= 60 && attempt < 1) {
        await sleep(retryAfter * 1000);
        return this.send(url, init, attempt + 1);
      }
    }

    if (response.status >= 500 && attempt < 1) {
      await sleep(1000);
      return this.send(url, init, attempt + 1);
    }

    return response;
  }

  private assertBudget(url: string) {
    if (this.rateLimit.remaining > RESERVED_REQUESTS) return;
    const resetAt = this.rateLimit.resetAt;
    if (resetAt && resetAt.getTime() <= Date.now()) {
      // The window rolled over; the next response will tell us the real number.
      this.rateLimit.remaining = this.rateLimit.limit;
      return;
    }
    throw new RateLimitError(
      "GitHub rate limit budget reserved for user-facing requests",
      resetAt ?? new Date(Date.now() + 60_000),
      url,
    );
  }

  private readRateLimit(response: Response) {
    const limit = Number(response.headers.get("x-ratelimit-limit"));
    const remaining = Number(response.headers.get("x-ratelimit-remaining"));
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    if (Number.isFinite(limit) && limit > 0) this.rateLimit.limit = limit;
    if (Number.isFinite(remaining)) this.rateLimit.remaining = remaining;
    if (Number.isFinite(reset) && reset > 0) this.rateLimit.resetAt = new Date(reset * 1000);
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 300);
  } catch {
    return "<no body>";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clears the in-process response cache. Used by tests and the jobs runner. */
export function clearGitHubCache(): void {
  responseCache.clear();
}
