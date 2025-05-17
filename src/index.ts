import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import helmet from 'helmet';
import cors from 'cors';
import { initializeDatabase } from './config/database';
import routes from './routes';
import { setWebSocketServer } from './controllers/pollController';
import { register } from 'prom-client';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Routes
app.use('/api', routes);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });
setWebSocketServer(wss);

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('error', console.error);
});

// Initialize database and start server
async function startServer() {
    try {
        await initializeDatabase();
        server.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 