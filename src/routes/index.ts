import { Router } from 'express';
import { authenticateToken, rateLimit } from '../middleware/auth';
import { createPoll, castVote, getPoll } from '../controllers/pollController';
import { getAnonymousToken } from '../controllers/authController';

const router = Router();

// Auth routes
router.post('/auth/anon', getAnonymousToken);

// Poll routes
router.post('/poll', authenticateToken, createPoll);
router.post('/poll/:id/vote', authenticateToken, rateLimit, castVote);
router.get('/poll/:id', getPoll);

export default router; 