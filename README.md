# ds-express-errors — Developer Review Project

Small Express + TypeScript API built to independently test [`ds-express-errors`](https://ds-express-errors.dev), an npm library for centralized error handling in Express applications.

This project was created for a paid developer-testing engagement. It is not intended to be a production application — it exists to exercise real error scenarios (database, validation, auth) against the library and document the developer experience.

## Stack

- Node.js + Express 5 + TypeScript
- Mongoose (MongoDB)
- Zod (validation)
- JWT (`jsonwebtoken`) + `bcrypt` (password hashing)
- Pino (logging)
- Vitest + Supertest (tests)

This stack was chosen because it matches technology the author already uses in real projects, per the terms of the testing engagement. There is no rate limiting, CORS, or Helmet — anything that doesn't produce an error scenario relevant to `ds-express-errors` was deliberately left out.

## Endpoints

| Method | Path               | Auth | Notes                                    |
| ------ | ------------------ | ---- | ---------------------------------------- |
| POST   | `/v1/auth/signup`  | –    | Zod validation, Mongoose duplicate key   |
| POST   | `/v1/auth/login`   | –    | JWT issuance, invalid credentials        |
| GET    | `/v1/products`     | –    | Zod query validation                     |
| GET    | `/v1/products/:id` | –    | Zod param validation, Mongoose not-found |
| POST   | `/v1/products`     | JWT  | Zod body validation                      |
| PATCH  | `/v1/products/:id` | JWT  | Zod body + param validation              |
| DELETE | `/v1/products/:id` | JWT  | Custom business-rule error               |

## Origin

This repo started as a trimmed-down copy of the author's own [nodejs-express-typescript-api-starter](https://github.com/juanjosechiroque/nodejs-express-typescript-api-starter), stripped of CI/CD, Docker app image, rate limiting, CORS/Helmet, and any other tooling unrelated to error handling, keeping only what's needed to exercise `ds-express-errors`: an `auth` module (Mongoose + JWT) and a `product` module (Mongoose + Zod).

## Baseline error handling

The error handling in this codebase was originally hand-rolled, with no third-party library — a custom error factory (`src/errors.ts`), a global error middleware, a Zod-to-error adapter, a JWT try/catch, and a generic `asyncHandler`. It was fully replaced by `ds-express-errors` during this project, across `auth/*` and `product/*` alike; the original hand-rolled files (`src/errors.ts`, `src/middleware/errorMiddleware.ts`, `src/utils/asyncHandler.ts`) were deleted once nothing referenced them anymore — see the git history for the full before/after comparison.

## Running locally

```bash
cp .env.example .env
docker compose up -d mongo
npm install
npm run dev
```

## Commands

```bash
npm run dev            # development server
npm run seed            # seed a demo user + products into MongoDB
npm run shutdown-test    # verifies graceful shutdown with a real SIGTERM (Mongo must be up)
npm test                # Vitest + Supertest
npm run test:coverage   # coverage report
npm run validate        # ESLint + Prettier check
npm run typecheck       # TypeScript typecheck
npm run build            # compile TypeScript to dist/
```
