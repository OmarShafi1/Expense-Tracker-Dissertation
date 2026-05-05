# Expense Tracker — Backend

REST API for the adaptive rule-based expense tracking application.

## Tech stack

- **Runtime:** Node.js 18+
- **Framework:** Express 4
- **Database:** MongoDB via Mongoose
- **Auth:** JWT + bcrypt
- **Validation:** express-validator
- **Security:** helmet, cors, express-rate-limit
- **Testing:** Jest + Supertest + mongodb-memory-server

## Local setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env and set MONGO_URI + JWT_SECRET

# 3. Seed the default categorisation rules
node src/utils/seedRules.js

# 4. Run in dev mode (auto-restart on file changes)
npm run dev
# OR run normally:
npm start
```

The server listens on `http://localhost:5000` by default.

## Tests

```bash
npm test
```

Tests use an in-memory MongoDB instance, so no real DB is required.

## API overview

| Method | Path                        | Description                          | Auth |
|--------|-----------------------------|--------------------------------------|------|
| GET    | /api/health                 | Health check                         | No   |
| POST   | /api/auth/register          | Create a new user                    | No   |
| POST   | /api/auth/login             | Log in, returns JWT                  | No   |
| GET    | /api/auth/me                | Current user                         | Yes  |
| GET    | /api/expenses/categories    | List of supported categories         | Yes  |
| POST   | /api/expenses/suggest       | Get a suggested category for a desc. | Yes  |
| POST   | /api/expenses               | Create an expense                    | Yes  |
| GET    | /api/expenses               | List user's expenses                 | Yes  |
| GET    | /api/expenses/summary       | Aggregated totals for dashboard      | Yes  |
| PUT    | /api/expenses/:id           | Update an expense                    | Yes  |
| DELETE | /api/expenses/:id           | Delete an expense                    | Yes  |
| GET    | /api/rules                  | View personal + global rules         | Yes  |
| DELETE | /api/rules/:id              | Delete one of your personal rules    | Yes  |
| POST   | /api/evaluation/log         | Log a usability test task            | Yes  |
| GET    | /api/evaluation/results     | Aggregated test results              | Yes  |

## Deployment (Render)

1. Push this repo to GitHub.
2. On render.com, create a new **Web Service** pointing at this repo.
3. Set the root directory to `backend/`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`.
7. After first deploy, run the seed script once via Render's shell: `node src/utils/seedRules.js`.
