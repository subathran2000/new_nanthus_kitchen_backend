# Nanthu's Kitchen - Backend API

NestJS-based REST API for the Nanthu's Kitchen restaurant management system.

## Tech Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with Passport
- **Real-time:** Socket.io WebSocket
- **Documentation:** Swagger/OpenAPI
- **Email:** Nodemailer

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Database Setup

```bash
# Run migrations
pnpm run migration:run

# Seed with sample data
pnpm run seed

# Reset database (development only)
pnpm run db:reset
```

### Running the Server

```bash
# Development (with hot reload)
pnpm run start:dev

# Debug mode
pnpm run start:debug

# Production
pnpm run build
pnpm run start:prod
```

## Project Structure

```
src/
├── common/           # Shared utilities, decorators, guards
│   ├── decorators/   # Custom decorators
│   ├── entities/     # Base entities
│   ├── enums/        # Shared enums
│   ├── filters/      # Exception filters
│   ├── guards/       # Auth guards
│   ├── logger/       # Custom logger
│   └── utils/        # Utility functions
├── config/           # Configuration modules
├── migrations/       # Database migrations
├── modules/          # Feature modules
│   ├── auth/         # Authentication
│   ├── email/        # Email service
│   ├── events/       # Events management
│   ├── health/       # Health checks
│   ├── menu/         # Menu management
│   ├── newsletter/   # Newsletter management
│   ├── opening-hours/# Opening hours
│   ├── specials/     # Daily specials
│   ├── upload/       # File uploads
│   ├── users/        # User management
│   └── websocket/    # Real-time updates
├── seeds/            # Database seeders
├── app.module.ts     # Root module
├── data-source.ts    # TypeORM CLI config
└── main.ts           # Application entry point
```

## API Endpoints

### Authentication

- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Users

- `GET /users` - List users
- `GET /users/:id` - Get user
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Menu

- `GET /menu/items` - List menu items
- `GET /menu/categories` - List categories
- `POST /menu/items` - Create item
- `PATCH /menu/items/:id` - Update item
- `DELETE /menu/items/:id` - Delete item

### Events

- `GET /events` - List events
- `POST /events` - Create event
- `PATCH /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### Health

- `GET /health` - Full health status
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

## Authentication

The API uses JWT authentication with HTTP-only cookies:

1. Login via `POST /auth/login` with credentials
2. Access token stored in HTTP-only cookie
3. Refresh token for token renewal
4. Include credentials in requests: `credentials: 'include'`

## WebSocket Events

Connect to `/` namespace for real-time updates:

### Events Emitted

- `menu:updated` - Menu item changed
- `event:updated` - Event changed
- `special:updated` - Special changed
- `settings:updated` - Settings changed

## Environment Variables

| Variable             | Required | Description                          |
| -------------------- | -------- | ------------------------------------ |
| `NODE_ENV`           | No       | Environment (development/production) |
| `PORT`               | No       | Server port (default: 3000)          |
| `DATABASE_HOST`      | Yes      | PostgreSQL host                      |
| `DATABASE_PORT`      | No       | PostgreSQL port (default: 5432)      |
| `DATABASE_NAME`      | Yes      | Database name                        |
| `DATABASE_USER`      | Yes      | Database user                        |
| `DATABASE_PASSWORD`  | Yes      | Database password                    |
| `JWT_SECRET`         | Yes      | JWT signing secret                   |
| `JWT_REFRESH_SECRET` | Yes      | Refresh token secret                 |
| `JWT_EXPIRATION`     | No       | Token expiry (default: 15m)          |
| `FRONTEND_URL`       | Yes      | Frontend URL for CORS                |
| `SMTP_HOST`          | Yes      | SMTP server host                     |
| `SMTP_PORT`          | No       | SMTP port (default: 587)             |
| `SMTP_USER`          | Yes      | SMTP username                        |
| `SMTP_PASS`          | Yes      | SMTP password                        |

## Testing

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# E2E tests
pnpm test:e2e
```

## Database Migrations

```bash
# Generate migration from entity changes
pnpm run migration:generate src/migrations/MigrationName

# Run pending migrations
pnpm run migration:run

# Revert last migration
pnpm run migration:revert
```

## Deployment

### Docker

```bash
# Build image
docker build -t nanthus-backend .

# Run container
docker run -p 3000:3000 --env-file .env nanthus-backend
```

### Health Checks

- `/health` - Comprehensive health status
- `/health/live` - Kubernetes liveness probe
- `/health/ready` - Kubernetes readiness probe

## Security

- Helmet security headers
- CORS configuration
- Rate limiting (Throttler)
- HTTP-only JWT cookies
- Password hashing with bcrypt
- Input validation with class-validator
- SQL injection prevention (TypeORM)

## License

Private - All rights reserved.
