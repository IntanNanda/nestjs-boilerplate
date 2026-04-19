# NestJS Boilerplate

A NestJS boilerplate. Designed with modular architecture, custom database provider, and modern tooling.

---

## Tech Stack

| Category | Technology |
|---------|-----------|
| Framework | NestJS v11 |
| Database | PostgreSQL via `pg` (node-postgres) Pool |
| Validation | `zod` (DTO + env validation) + custom `ZodValidationPipe` |
| Auth | `@nestjs/jwt` + custom guard + `bcrypt` |
| Config | `@nestjs/config` |
| API Docs | `@nestjs/swagger` + `swagger-ui-express` |
| Rate Limit | `@nestjs/throttler` |
| Schedule | `@nestjs/schedule` |
| Logger | `winston` |
| Lint & Format | **BiomeJS** |
| Testing | **Vitest** + `@nestjs/testing` + `supertest` |

---

## Features

- **Raw SQL PostgreSQL** — Full control over queries
- **JWT Authentication** — Custom JWT guard
- **Global Guards** — `@Public()` decorator for whitelisting endpoints
- **Auto-validation** — DTOs with Zod schema + custom `ZodValidationPipe`
- **API Documentation** — Swagger UI with Bearer auth
- **Rate Limiting** — Global throttle protection
- **Winston Logger** — Console + file logging
- **Security** — Helmet, CORS
- **Soft Delete** — Soft delete pattern on users table
- **Pagination** — Reusable pagination utility
- **Repository Pattern** — Each module has its own repository for raw SQL

---

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14
- Redis (optional)

---

## Quick Start

### 1. Clone & Install

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` according to your database configuration:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=yourpassword
DB_NAME=nestjs_boilerplate

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d
```

### 3. Setup Database

Create the `users` table manually or run the following SQL in PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

### 4. Seed Data (Optional)

```bash
npm run db:seed
```

### 5. Run Development Server

```bash
npm run start:dev
```

Access the app at `http://localhost:3000`

Swagger UI: `http://localhost:3000/api/docs`

---

## Docker

### Build Image

```bash
docker build -t nestjs-boilerplate .
```

### Run Container

```bash
docker run -p 3000:3000 --env-file .env nestjs-boilerplate
```

### Docker Compose (Optional)

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    env_file:
      - .env
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nestjs_boilerplate
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:

```bash
docker-compose up -d
```

---

## Available Scripts

```bash
# Development
npm run start:dev         # Watch mode
npm run start:debug       # Debug mode
npm run start:prod        # Production mode

# Build
npm run build             # Build project

# Lint & Format
npm run lint              # BiomeJS lint check
npm run lint:fix          # BiomeJS lint fix
npm run format            # BiomeJS format

# Testing
npm run test:unit         # Run unit tests
npm run test:unit:watch   # Run unit tests in watch mode
npm run test:e2e          # Run E2E tests
npm run test:coverage     # Run tests with coverage

# Database
npm run db:seed           # Seed dummy data
```

---

## Project Structure

```
├── src/
│   ├── main.ts                      # Entry point bootstrap
│   ├── app.module.ts                # Root module
│   ├── common/                      # Shared utilities
│   │   ├── filters/                 # Exception filters
│   │   ├── guards/                  # Auth guards (JwtAuthGuard)
│   │   ├── interceptors/            # Response & logging interceptors
│   │   ├── pipes/                   # ZodValidationPipe
│   │   ├── decorators/              # @CurrentUser(), @Public()
│   │   ├── utils/                   # Pagination utility
│   │   └── logger/                  # Winston logger service
│   ├── config/                      # Environment config & validation (Zod)
│   ├── database/                    # PostgreSQL module (pg Pool)
│   ├── modules/
│   │   ├── auth/                    # Auth module (JWT)
│   │   └── users/                   # Users module (CRUD raw SQL)
├── tests/                           # All tests (unit + e2e)
│   ├── e2e/                         # End-to-end tests
│   └── *.spec.ts                    # Unit tests
├── scripts/
│   └── seed.ts                      # Seed script
├── .env.example
├── biome.json                       # BiomeJS config
├── vitest.config.ts                 # Vitest unit test config
└── package.json
```

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Public | Login with email & password |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Bearer | List users with pagination |
| GET | `/users/:id` | Bearer | Get user by ID |
| POST | `/users` | Bearer | Create new user |
| PATCH | `/users/:id` | Bearer | Update user |
| DELETE | `/users/:id` | Bearer | Soft delete user |

---

## Authentication

Use the `POST /auth/login` endpoint to obtain an access token:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    }
  }
}
```

Use the token in the header for every request:
```
Authorization: Bearer <accessToken>
```

---

## DTO Validation with Zod

All DTOs use Zod schemas with a custom `ZodValidationPipe`:

```typescript
import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class LoginDto {
  static schema = loginSchema;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;
}
```

The global `ZodValidationPipe` automatically validates incoming requests against the DTO's `schema`.

---

## Database Pattern

The database is accessed through a **custom provider** with the `PG_CONNECTION` token:

```typescript
import { PG_CONNECTION } from '@/database/database.constants';

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_CONNECTION) private readonly pool: Pool) {}

  async findAll() {
    const result = await this.pool.query('SELECT * FROM users');
    return result.rows;
  }
}
```

All queries are written in **raw SQL** for maximum performance and full control.

---

## Testing

### Unit Test

```bash
npm run test:unit
```

Unit tests use a mock `PG_CONNECTION`:

```typescript
const mockPool = {
  query: vi.fn(),
};
```

### E2E Test

```bash
npm run test:e2e
```

E2E tests bootstrap the full NestJS application with a mocked database.

### Coverage

```bash
npm run test:coverage
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | — | PostgreSQL username |
| `DB_PASS` | — | PostgreSQL password |
| `DB_NAME` | — | PostgreSQL database name |
| `REDIS_URL` | — | Redis connection URL (optional) |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | `1d` | JWT expiration time |
| `THROTTLE_TTL` | `60` | Rate limit window (seconds) |
| `THROTTLE_LIMIT` | `100` | Max requests per window |

---

## License

MIT
