import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Authentication token required' });
        return;
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as JWTPayload;
        req.user = user;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export const generateAnonymousToken = (): string => {
    const user_id = `anon_${Math.random().toString(36).substring(2, 15)}`;
    const secret = (process.env.JWT_SECRET || 'default_secret') as jwt.Secret;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    return jwt.sign({ user_id }, secret, { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}; 