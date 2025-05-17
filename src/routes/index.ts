import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { createPoll, castVote, getPoll } from '../controllers/pollController';
import { getAnonymousToken } from '../controllers/authController';

const router = Router();

// Auth routes
router.post('/auth/anon', getAnonymousToken);

// Poll routes
router.post('/poll', authenticateToken, createPoll);
router.post('/poll/:id/vote', authenticateToken, rateLimit, castVote as any); // Type assertion to fix TS error
router.get('/poll/:id', getPoll);

export default router;