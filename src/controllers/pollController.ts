import { Request, Response } from 'express';
import { pool } from '../config/database';
import { CreatePollRequest, VoteRequest, PollResult } from '../types';
import { WebSocketServer } from 'ws';

let wss: WebSocketServer;

export const setWebSocketServer = (server: WebSocketServer) => {
    wss = server;
};

export const createPoll = async (req: Request<{}, {}, CreatePollRequest>, res: Response) => {
    const { question, options, expires_at } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO polls (question, options, expires_at) VALUES ($1, $2, $3) RETURNING *',
            [question, JSON.stringify(options), new Date(expires_at)]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Failed to create poll' });
    }
};

export const castVote = async (req: Request<{ id: string }, {}, VoteRequest>, res: Response) => {
    const { id } = req.params;
    const { option_index } = req.body;
    const user_id = req.user!.user_id;

    try {
        // Check if poll exists and is not closed
        const pollResult = await pool.query(
            'SELECT * FROM polls WHERE id = $1 AND is_closed = false AND expires_at > NOW()',
            [id]
        );

        if (pollResult.rows.length === 0) {
            return res.status(404).json({ error: 'Poll not found or closed' });
        }

        const poll = pollResult.rows[0];
        const options = JSON.parse(poll.options);

        if (option_index < 0 || option_index >= options.length) {
            return res.status(400).json({ error: 'Invalid option index' });
        }

        // Insert or update vote
        await pool.query(
            `INSERT INTO votes (poll_id, user_id, option_index)
             VALUES ($1, $2, $3)
             ON CONFLICT (poll_id, user_id)
             DO UPDATE SET option_index = $3`,
            [id, user_id, option_index]
        );

        // Get updated results
        const results = await getPollResults(id);
        
        // Broadcast update to WebSocket clients
        broadcastPollUpdate(id, results);

        res.json({ message: 'Vote recorded successfully' });
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).json({ error: 'Failed to cast vote' });
    }
};

export const getPoll = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    try {
        const results = await getPollResults(id);
        res.json(results);
    } catch (error) {
        console.error('Error getting poll:', error);
        res.status(500).json({ error: 'Failed to get poll' });
    }
};

async function getPollResults(pollId: string): Promise<PollResult> {
    const pollResult = await pool.query('SELECT * FROM polls WHERE id = $1', [pollId]);
    
    if (pollResult.rows.length === 0) {
        throw new Error('Poll not found');
    }

    const poll = pollResult.rows[0];
    const options = JSON.parse(poll.options);
    
    const votesResult = await pool.query(
        'SELECT option_index, COUNT(*) as count FROM votes WHERE poll_id = $1 GROUP BY option_index',
        [pollId]
    );

    const votes: Record<number, number> = {};
    let total_votes = 0;

    votesResult.rows.forEach((row) => {
        votes[row.option_index] = parseInt(row.count);
        total_votes += parseInt(row.count);
    });

    return {
        poll: {
            ...poll,
            options
        },
        votes,
        total_votes
    };
}

function broadcastPollUpdate(pollId: string, results: PollResult) {
    if (!wss) return;

    const message = JSON.stringify({
        type: 'vote',
        poll_id: pollId,
        data: results
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
} 