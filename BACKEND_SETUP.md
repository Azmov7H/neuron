# Backend Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB Atlas account or local MongoDB
- pnpm or npm

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Fill in your values:
# - MongoDB connection string
# - JWT secrets
# - OpenAI API key (if using AI features)
```

### 3. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 4. Initialize Database

```bash
# Run one-time seed
npm run seed

# Or use TypeScript directly
ts-node src/database/seed.ts
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## Project Structure

```
src/
├── config/                  # Configuration (env vars)
├── database/
│   ├── connection.ts        # MongoDB connection
│   ├── models/              # Mongoose schemas
│   └── seed.ts             # Database seeding
├── types/                   # TypeScript interfaces
├── lib/
│   ├── auth/               # JWT, tokens
│   ├── ai/                 # LLM integration
│   └── utils/              # Helpers (response, errors)
├── middleware/             # Auth, error handling
├── validations/            # Zod schemas
└── modules/                # Feature modules
    ├── auth/              # Auth service
    ├── users/             # User management
    ├── evolution/         # XP, ranks, streaks
    ├── spark-ai/          # AI mentoring
    ├── neural-paths/      # Learning paths
    ├── recommendations/   # Rec engine
    └── discoveries/       # Concept tracking

app/api/                    # API route handlers
```

## API Usage Examples

### Authentication

#### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "learner123",
    "email": "user@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

#### Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "existing_refresh_token"}'
```

### Protected Endpoints (require Authorization header)

#### Get User Profile
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer access_token"
```

#### Get Evolution Stats
```bash
curl -X GET http://localhost:3000/api/evolution/stats \
  -H "Authorization: Bearer access_token"
```

#### Get Recommendations
```bash
curl -X GET http://localhost:3000/api/recommendations?limit=5 \
  -H "Authorization: Bearer access_token"
```

#### Create Spark Session
```bash
curl -X POST http://localhost:3000/api/spark/sessions \
  -H "Authorization: Bearer access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "physics",
    "currentPathId": "path-id"
  }'
```

### Public Endpoints

#### Get Leaderboard
```bash
curl -X GET 'http://localhost:3000/api/evolution/leaderboard?limit=100'
```

## Development Workflow

### Adding a New Feature

1. **Define Types** (`src/types/index.ts`)
   - Add interfaces for your domain

2. **Create Model** (`src/database/models/`)
   - Design MongoDB schema with validation

3. **Create Service** (`src/modules/{feature}/`)
   - Business logic, separated from API

4. **Add Validation** (`src/validations/schemas.ts`)
   - Zod schemas for request validation

5. **Create API Routes** (`app/api/{feature}/`)
   - Connect services to HTTP endpoints

### Example: Adding User Preferences

```typescript
// 1. Types
interface UserPreference {
  userId: string;
  theme: 'light' | 'dark';
  notifications: boolean;
}

// 2. Model
const preferencesSchema = new Schema({ ... });

// 3. Service
class PreferenceService {
  static async updatePreference(userId, preference) { ... }
}

// 4. Validation
const UpdatePreferenceSchema = z.object({ ... });

// 5. Route
// POST /api/users/preferences
export const POST = withErrorHandling(requireAuth(handler));
```

## Database Schema

### User
- Credentials (email, password)
- Progression (XP, rank, streak)
- Learning profile
- Domain-specific stats

### NeuralPath
- Course content structure
- Chapters with objectives
- Prerequisites
- Engagement metrics

### SparkSession
- Conversation history
- AI context
- Auto-expiring (30 days)

### Discovery
- Concept tracking
- Interest scoring
- Source attribution

### Recommendation
- Personalized suggestions
- Confidence scoring
- Auto-expiring (7 days)

## Performance Optimization

### Database Indexes
- User lookup: email, username
- Path queries: domain, difficulty, active
- Progress tracking: userId + pathId
- Recommendations: userId, type, expiry

### Caching Strategy
- User profiles (1 hour)
- Recommendations (30 min)
- Leaderboard (5 min)
- Paths (2 hours)

### Future Redis Integration
```typescript
// Ready for Redis cache layer
const cache = {
  get: async (key) => { ... },
  set: async (key, value, ttl) => { ... },
  del: async (key) => { ... }
}
```

## Authentication Flow

```
1. User registers/logs in
2. Server generates JWT + Refresh Token
3. Client stores both (localStorage + httpOnly cookie)
4. On each request: Authorization: Bearer {token}
5. Before expiry: POST /refresh with refreshToken
6. Auto-renew without user interaction
```

### Security

- Passwords hashed with bcrypt (12 rounds)
- JWT signed with HS256
- Refresh tokens stored separately
- Rate limiting on auth endpoints
- Validation on all inputs
- CORS-ready structure

## Deployment

### Prerequisites
- Node.js runtime
- MongoDB Atlas (or self-hosted)
- Redis (optional, for caching)

### Environment Variables
All required variables in `.env.production`

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

## Monitoring & Debugging

### Logs
```bash
# Development
NODE_ENV=development npm run dev

# Production with logging
LOG_LEVEL=debug npm start
```

### Database Inspection
```bash
# MongoDB Atlas UI
# or
mongosh "mongodb+srv://..."
```

### API Testing
- Postman collection (included)
- cURL examples above
- Frontend integration tests

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check connection string format
mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Verify IP whitelist in Atlas
# Check credentials are correct
```

### JWT Errors
```
Invalid token → Check JWT_SECRET matches
Token expired → Use refresh endpoint
Missing auth → Add Authorization header
```

### Rate Limiting
Too many auth requests from IP → Wait 1 hour or change IP

## Next Steps

1. Implement Redis caching
2. Add real OpenAI integration
3. Build recommendation algorithm
4. Implement WebSocket for real-time
5. Add vector search for knowledge graph
6. Performance load testing
7. Security audit
8. CI/CD pipeline
