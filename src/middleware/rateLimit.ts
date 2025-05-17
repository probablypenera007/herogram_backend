import { Request, Response, NextFunction } from 'express';
import { redisClient, redisGet, redisSet } from '../config/database';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '5');

export const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required for rate limiting' });
    }

    const key = `ratelimit:${req.user.user_id}`;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    try {
        const requests = await redisGet(key);
        const requestData = requests ? JSON.parse(requests) : [];

        // Remove expired requests
        const validRequests = requestData.filter((timestamp: number) => timestamp > windowStart);

        if (validRequests.length >= MAX_REQUESTS) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil((validRequests[0] + WINDOW_MS - now) / 1000)
            });
        }

        // Add current request
        validRequests.push(now);
        await redisSet(key, JSON.stringify(validRequests), 'EX', Math.ceil(WINDOW_MS / 1000));

        next();
    } catch (error) {
        console.error('Rate limit error:', error);
        next(); // Fail open in case of Redis errors
    }
}; 