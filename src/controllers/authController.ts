import { Request, Response } from 'express';
import { generateAnonymousToken } from '../middleware/auth';

export const getAnonymousToken = (req: Request, res: Response) => {
    try {
        const token = generateAnonymousToken();
        res.json({ token });
    } catch (error) {
        console.error('Error generating anonymous token:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
}; 