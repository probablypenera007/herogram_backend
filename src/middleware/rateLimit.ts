import { Request, Response, NextFunction } from 'express';
import { redisClient, redisGet, redisSet } from '../config/database';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '5');

export const rateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required for rate limiting' });
        return;
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
            res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil((validRequests[0] + WINDOW_MS - now) / 1000)
            });
            return;
        }

        // Add current request
        validRequests.push(now);
        await redisClient.set(key, JSON.stringify(validRequests), {
            EX: Math.ceil(WINDOW_MS / 1000)
        });

        next();
    } catch (error) {
        console.error('Rate limit error:', error);
        next(); // Fail open in case of Redis errors
    }
}; 