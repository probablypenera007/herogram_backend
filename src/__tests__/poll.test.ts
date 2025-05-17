import request from 'supertest';
import { app } from '../index';
import { pool } from '../config/database';

describe('Poll API', () => {
    let authToken: string;
    let pollId: number;

    beforeAll(async () => {
        // Get anonymous token
        const response = await request(app)
            .post('/api/auth/anon')
            .send();
        authToken = response.body.token;
    });

    afterAll(async () => {
        await pool.end();
    });

    it('should create a new poll', async () => {
        const pollData = {
            question: 'Test Poll',
            options: ['Option 1', 'Option 2'],
            expires_at: new Date(Date.now() + 3600000).toISOString()
        };

        const response = await request(app)
            .post('/api/poll')
            .set('Authorization', `Bearer ${authToken}`)
            .send(pollData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        pollId = response.body.id;
    });

    it('should cast a vote', async () => {
        const response = await request(app)
            .post(`/api/poll/${pollId}/vote`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ option_index: 0 });

        expect(response.status).toBe(200);
    });

    it('should get poll results', async () => {
        const response = await request(app)
            .get(`/api/poll/${pollId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('poll');
        expect(response.body).toHaveProperty('votes');
        expect(response.body).toHaveProperty('total_votes');
    });
}); 