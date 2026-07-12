// Sprint-32-Step-05: Rate limiting middleware for audit endpoints
// Also maintains backward compatibility with existing AI endpoint rate limiting
// Implements in-memory rate limiting with configurable limits per endpoint
// Supports RATE_LIMIT_DISABLED=true env var for testing

export interface RateLimitConfig {
  requests: number; // Maximum requests in the window
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
}

// Rate limiting configuration per endpoint
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  "GET /api/audit/events/me": {
    requests: 30,
    windowMs: 60000, // 1 minute
  },
  "GET /api/audit/events": {
    requests: 60,
    windowMs: 60000, // 1 minute
  },
  "GET /api/audit/events/stats": {
    requests: 30,
    windowMs: 60000, // 1 minute
  },
};

// In-memory storage for rate limit tracking
// Structure: Map<identifier, Map<endpoint, { count, resetTime }>>
const rateLimitStore = new Map<
  string,
  Map<
    string,
    {
      count: number;
      resetTime: number;
    }
  >
>();

// Legacy rate limit map for backward compatibility with AI endpoints
interface LegacyRateLimitEntry {
  count: number;
  resetAt: number;
}

const legacyRateLimitMap = new Map<string, LegacyRateLimitEntry>();

// Auto-cleanup every minute for legacy entries
setInterval(() => {
  const now = Date.now();
  legacyRateLimitMap.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      legacyRateLimitMap.delete(key);
    }
  });
}, 60000);

/**
 * Apply rate limiting to a request (new audit endpoints)
 * @param identifier - Unique identifier for the rate limit (e.g., userId, IP address)
 * @param endpoint - The endpoint being called (e.g., "GET /api/audit/events/me")
 * @param customConfig - Optional custom configuration, defaults to DEFAULT_RATE_LIMITS
 * @returns RateLimitResult with allowed status and remaining requests
 */
export async function applyRateLimit(
  identifier: string,
  endpoint: string,
  customConfig?: RateLimitConfig,
): Promise<RateLimitResult> {
  // Check if rate limiting is disabled
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return {
      allowed: true,
      remaining: -1, // -1 indicates disabled
      resetTime: Math.floor(Date.now() / 1000),
    };
  }

  // Get configuration for this endpoint
  const config = customConfig || DEFAULT_RATE_LIMITS[endpoint];
  if (!config) {
    // No rate limit configured for this endpoint
    return {
      allowed: true,
      remaining: -1,
      resetTime: Math.floor(Date.now() / 1000),
    };
  }

  const now = Date.now();
  const currentTime = Math.floor(now / 1000); // Unix timestamp in seconds

  // Get or create tracking map for this identifier
  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, new Map());
  }

  const identifierMap = rateLimitStore.get(identifier)!;

  // Get or create tracking for this endpoint
  let tracker = identifierMap.get(endpoint);
  if (!tracker) {
    tracker = {
      count: 0,
      resetTime: currentTime + Math.ceil(config.windowMs / 1000),
    };
    identifierMap.set(endpoint, tracker);
  }

  // Check if the window has expired
  if (currentTime >= tracker.resetTime) {
    // Reset the counter
    tracker.count = 0;
    tracker.resetTime = currentTime + Math.ceil(config.windowMs / 1000);
  }

  // Check if the limit is exceeded
  if (tracker.count >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: tracker.resetTime,
    };
  }

  // Increment the counter
  tracker.count += 1;
  const remaining = Math.max(0, config.requests - tracker.count);

  return {
    allowed: true,
    remaining,
    resetTime: tracker.resetTime,
  };
}

/**
 * Clean up expired entries from the rate limit store to prevent memory leaks
 * Should be called periodically (e.g., every 5 minutes)
 */
export function cleanupExpiredEntries(): void {
  const now = Math.floor(Date.now() / 1000);

  rateLimitStore.forEach((identifierMap, identifier) => {
    identifierMap.forEach((tracker, endpoint) => {
      // Remove entries that have been reset for more than 1 hour
      if (tracker.resetTime + 3600 < now) {
        identifierMap.delete(endpoint);
      }
    });

    // Clean up empty identifier maps
    if (identifierMap.size === 0) {
      rateLimitStore.delete(identifier);
    }
  });
}

/**
 * Reset rate limit for a specific identifier and endpoint (for testing)
 */
export function resetRateLimit(identifier: string, endpoint?: string): void {
  if (!rateLimitStore.has(identifier)) {
    return;
  }

  const identifierMap = rateLimitStore.get(identifier)!;
  if (endpoint) {
    identifierMap.delete(endpoint);
  } else {
    rateLimitStore.delete(identifier);
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY: Legacy functions for existing AI endpoint routes
// ============================================================================

/**
 * Legacy rate limit check for AI endpoints (book-field, critic, reader, etc.)
 * @param clientIp - Client IP address to rate limit
 * @returns Object with allowed boolean
 */
export function checkRateLimit(clientIp: string): { allowed: boolean } {
  const enabled = process.env.RATE_LIMIT_ENABLED === "true";
  if (!enabled) return { allowed: true };

  const maxRequests = parseInt(
    process.env.RATE_LIMIT_REQUESTS_PER_WINDOW || "10",
    10,
  );
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 min default

  const now = Date.now();
  const entry = legacyRateLimitMap.get(clientIp);

  if (!entry || entry.resetAt <= now) {
    legacyRateLimitMap.set(clientIp, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Extract client IP from request headers
 * @param request - Request object
 * @returns Client IP address string
 */
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
