/**
 * Installation & Dependencies
 * Required packages for Neuron backend
 */

## Backend Dependencies

### Core Framework
- **next@16.2.6** - React framework with API routes
- **react@19.2.4** - UI library
- **typescript@^5** - Type safety

### Database & ORM
- **mongodb** - MongoDB driver (auto-installed with mongoose)
- **mongoose@^7.0.0** - MongoDB ODM with schema validation

### Authentication & Security
- **jsonwebtoken@^9.0.0** - JWT token generation/verification
- **bcrypt@^5.1.0** - Password hashing

### Validation
- **zod@^4.4.3** - Schema validation (schema-first)

### Development Dependencies
```json
{
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "eslint": "^9",
    "eslint-config-next": "16.2.6",
    "typescript": "^5"
  }
}
```

## Installation Commands

```bash
# Core dependencies
pnpm add mongoose jsonwebtoken bcrypt zod

# For JWT types
pnpm add -D @types/jsonwebtoken

# For bcrypt types
pnpm add -D @types/bcrypt

# Alternative: install all at once
pnpm add mongoose jsonwebtoken bcrypt zod @types/jsonwebtoken @types/bcrypt
```

## Environment Variables

Required when first starting:

```bash
# .env.local
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-32-char-secret
REFRESH_TOKEN_SECRET=your-32-char-secret
OPENAI_API_KEY=sk-...
NODE_ENV=development
```

## Package.json Scripts to Add

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "seed": "ts-node src/database/seed.ts",
    "clear-db": "ts-node -e \"import { clearDatabase } from 'src/database/seed'; clearDatabase()\"",
    "api-test": "node test/api.test.js"
  }
}
```

## Verification Checklist

- [ ] MongoDB connection string obtained
- [ ] JWT secrets generated (use: `openssl rand -base64 32`)
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database seeded
- [ ] Server starts without errors
- [ ] API endpoints respond (test with curl/Postman)
- [ ] JWT auth working
- [ ] Basic API calls successful

## Troubleshooting Installation

### MongoDB Connection Fails
```bash
# Check connection string
# Format: mongodb+srv://user:password@cluster.mongodb.net/dbname

# Verify:
1. Username and password correct
2. IP whitelist includes your IP
3. Network access enabled
```

### Port Already in Use
```bash
# Change PORT in .env.local
PORT=3001

# Or kill existing process
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors
```bash
# Regenerate types
npm run type-check

# Clear cache
rm -rf .next
npm run build
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear TypeScript cache
tsc --clean
```
