/**
 * Rate limiter middleware
 * Simple in-memory rate limiting (for production, use Redis)
 */

const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // per window

export function rateLimiter(req, res, next) {
  const identifier = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Get or create request data
  let requestData = requestCounts.get(identifier);
  
  if (!requestData) {
    requestData = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
    requestCounts.set(identifier, requestData);
  }
  
  // Reset if window expired
  if (now > requestData.resetTime) {
    requestData.count = 0;
    requestData.resetTime = now + WINDOW_MS;
  }
  
  // Increment counter
  requestData.count++;
  
  // Check limit
  if (requestData.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
    
    res.set('Retry-After', retryAfter.toString());
    
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter
    });
  }
  
  // Add rate limit headers
  res.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.set('X-RateLimit-Remaining', (MAX_REQUESTS - requestData.count).toString());
  res.set('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());
  
  next();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime + WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
}, WINDOW_MS);

export default rateLimiter;
