/**
 * Architecture Documentation
 * Backend System Overview and Best Practices
 */

# Neuron Backend Architecture

## System Overview

Neuron is built on a **modular, scalable backend architecture** designed for AI-powered personalized learning. The system separates concerns using clean architecture principles and is optimized for future growth.

## Directory Structure

```
src/
├── config/              # Configuration management
│   └── env.ts          # Environment variables with validation
├── database/           # Database layer
│   ├── connection.ts   # MongoDB connection with retry
│   └── models/         # Mongoose schemas
├── types/              # TypeScript type definitions
├── lib/                # Shared utilities
│   ├── auth/          # Authentication utilities (JWT, tokens)
│   └── utils/         # Helper functions (responses, validation)
├── middleware/         # Express-like middleware (auth, errors)
├── validations/        # Zod schemas for request validation
└── modules/            # Feature modules (each self-contained)
    ├── auth/          # Authentication service
    ├── users/         # User management
    ├── evolution/     # Progression & XP tracking
    ├── spark-ai/      # AI mentor system
    ├── neural-paths/  # Learning path management
    ├── recommendations/ # Recommendation engine
    ├── discoveries/   # Concept discovery tracking
    └── matrix/        # Knowledge graph (future)
```

## Core Patterns

### 1. **Repository Pattern**
Each module has access to models through services, abstracting data access.

### 2. **Service Layer**
Business logic is encapsulated in service classes, keeping routes clean.

### 3. **Middleware Chain**
Authentication → Validation → Business Logic → Response

### 4. **Error Handling**
Centralized AppError class with typed error responses.

## Key Features

### Authentication Flow
1. User registers/logs in
2. JWT tokens generated (access + refresh)
3. Refresh tokens stored client-side
4. Automatic token refresh before expiration
5. Rate limiting on auth endpoints

### Evolution System
- XP accumulation per domain
- Automatic rank calculation
- Streak tracking
- Achievement milestones
- Leaderboard generation

### Spark AI Integration
- Session-based conversations
- Message history with TTL
- Context awareness (current path/chapter)
- AI memory for personalization
- Insight extraction

### Recommendation Engine
- User behavior analysis
- Discovery-based suggestions
- Confidence scoring
- Multi-factor recommendations
- Expiring recommendations (7 days)

### Data Persistence
- MongoDB for document storage
- Mongoose for schema validation
- TTL indexes for auto-cleanup
- Compound indexes for query optimization
- Connection pooling

## Best Practices Implemented

### TypeScript
- Full type coverage with strict mode
- Type-safe database operations
- Request/response typing
- Custom error types

### Validation
- Zod for schema validation
- Pre-save hooks in models
- Request body validation
- Query parameter validation

### Security
- JWT with HS256
- bcrypt password hashing (12 rounds)
- Rate limiting on auth endpoints
- Input sanitization via Zod
- CORS-ready structure

### Performance
- Database connection pooling
- Query optimization with indexes
- Lazy loading of relations
- Caching structure (ready for Redis)
- Pagination support

### Scalability
- Modular service architecture
- Single responsibility per service
- Stateless API routes
- Database indexes on frequently queried fields
- TTL indexes for automatic cleanup

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh tokens

### Users
- `GET /api/users/profile` - Get user profile (auth required)
- `PUT /api/users/profile` - Update profile (auth required)

### Evolution
- `GET /api/evolution/stats` - User statistics (auth required)
- `GET /api/evolution/leaderboard` - Global leaderboard
- `POST /api/evolution/xp` - Award XP (auth required)

### Spark AI
- `POST /api/spark/sessions` - Create session (auth required)
- `POST /api/spark/sessions/{id}/messages` - Send message (auth required)
- `GET /api/spark/sessions` - List sessions (auth required)

### Recommendations
- `GET /api/recommendations` - Get recommendations (auth required)
- `POST /api/recommendations/{id}/click` - Track click (auth required)

## Database Models

### User
- Authentication credentials
- Progression metrics (XP, rank, streak)
- Cognitive profile
- Domain-specific progress
- Learning history

### NeuralPath
- Learning content structure
- Chapter organization
- Difficulty levels
- Prerequisite management
- Engagement metrics

### UserProgress
- Per-path progress tracking
- Chapter-level completion
- Time tracking
- XP tracking
- Completion dates

### SparkSession
- Conversation history
- AI context
- Insights extraction
- TTL-based cleanup

### Discovery
- Concept tracking
- Interest scoring
- User engagement
- Source tracking

### Recommendation
- Personalized suggestions
- Relevance scoring
- Multi-source tracking
- Expiration handling

## Future Enhancements

1. **Redis Caching**
   - Cache recommendations (30 min TTL)
   - Cache user profiles (1 hour TTL)
   - Cache leaderboard (5 min TTL)

2. **Knowledge Graph**
   - Concept relationships
   - Difficulty progression
   - Prerequisite chains
   - Interdisciplinary connections

3. **Advanced Analytics**
   - Learning pattern detection
   - Optimal session timing
   - Concept difficulty calibration
   - Personalized pacing

4. **Real-time Features**
   - WebSocket for live chat
   - Leaderboard updates
   - Achievement notifications
   - Progress streaming

5. **AI Enhancements**
   - Vector embeddings for concepts
   - Semantic search
   - Multi-modal learning support
   - Adaptive difficulty

## Environment Setup

```bash
# Required environment variables
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret
OPENAI_API_KEY=sk-...
NODE_ENV=production
PORT=3000
```

## Development Workflow

1. Add types in `/src/types`
2. Create Mongoose model in `/src/database/models`
3. Create service in `/src/modules/{feature}`
4. Add validation schema in `/src/validations`
5. Create API routes in `/app/api/{feature}`
6. Add middleware wrapper if needed

## Testing Strategy

- Unit tests for services
- Integration tests for API routes
- Database seeding for test data
- Mock external services (OpenAI)
- Load testing for scalability

## Deployment Considerations

- Database backups and replicas
- Connection pooling optimization
- API rate limiting
- Error logging and monitoring
- Performance tracking
- Security headers
- CORS configuration
