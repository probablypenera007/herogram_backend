# Team Polls Backend

A real-time polling system built with Node.js, Express, PostgreSQL, and Redis.

## Features

- Create polls with multiple options
- Real-time vote updates via WebSocket
- Anonymous authentication
- Rate limiting
- Prometheus metrics
- Docker support

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 14+
- Redis 6+

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Docker Deployment

```bash
docker-compose up --build
```

## API Endpoints

### Authentication

- `POST /api/auth/anon`
  - Get an anonymous JWT token
  - No authentication required

### Polls

- `POST /api/poll`
  - Create a new poll
  - Requires authentication
  - Body: `{ question: string, options: string[], expires_at: string }`

- `POST /api/poll/:id/vote`
  - Cast a vote
  - Requires authentication
  - Rate limited to 5 requests per minute
  - Body: `{ option_index: number }`

- `GET /api/poll/:id`
  - Get poll results
  - No authentication required

### WebSocket

Connect to `ws://localhost:3000` to receive real-time updates.

## Testing

```bash
npm test
```

## Monitoring

- Prometheus metrics available at `/metrics`
- Basic request logging enabled

## Architecture

- Express.js for REST API
- WebSocket for real-time updates
- PostgreSQL for persistent storage
- Redis for rate limiting and caching
- JWT for authentication
- Docker for containerization

## Security

- Helmet.js for security headers
- Rate limiting per user
- JWT-based authentication
- Environment-based configuration

## Scaling

The application is designed to scale horizontally:
- Stateless API servers
- Redis for WebSocket fan-out
- Connection pooling for PostgreSQL
- Rate limiting with Redis

## License

ISC 