# Expense Tracker — Backend

Node.js/Express REST API with MongoDB.

## Setup

```bash
cd backend
npm install
cp .env.example .env
node src/utils/seedRules.js
npm run dev
```

## Environment variables

| Variable   | Description                        |
|------------|------------------------------------|
| MONGO_URI  | MongoDB Atlas connection string    |
| JWT_SECRET | Long random string for JWT signing |
| CLIENT_URL | Frontend URL (for CORS)            |
| PORT       | Port number, defaults to 5000      |

## Tests

```bash
npm test
```
