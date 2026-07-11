// Rate limiting utility for API routes
// Uses in-memory Map with sliding window (15 minutes, configurable)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Auto-cleanup every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

export function checkRateLimit(clientIp: string): { allowed: boolean } {
  const enabled = process.env.RATE_LIMIT_ENABLED === "true";
  if (!enabled) return { allowed: true };

  const maxRequests = parseInt(
    process.env.RATE_LIMIT_REQUESTS_PER_WINDOW || "10",
    10,
  );
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 min default

  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false };
  }

  entry.count++;
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const via = request.headers.get("via");
  if (via) {
    return via.split(",")[0].trim();
  }
  return "unknown";
}
