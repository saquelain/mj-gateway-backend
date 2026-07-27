import type { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../db/redis.js';
import type { AuthenticatedApiRequest } from './apiKeyAuth.js';

const limiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl',
  points: 100,   // requests
  duration: 60,  // per minute
});

export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  const { apiKeyId } = req as AuthenticatedApiRequest;
  try {
    await limiter.consume(String(apiKeyId));
    next();
  } catch {
    res.status(429).json({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } });
  }
}