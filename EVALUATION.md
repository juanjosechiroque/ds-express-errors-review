# ds-express-errors v1.9.1: Developer Review

- **Library version tested:** ds-express-errors v1.9.1
- **Stack:** Node.js + Express 5 + TypeScript + Mongoose + Zod + JWT
- **Experience level:** Senior
- **Overall rating:** 8/10. A solid approach to centralized error handling, best suited for new projects rather than migrations.
- **Test repo:** https://github.com/juanjosechiroque/ds-express-errors-review

## What I built

A small Express + TypeScript API, based on my own API starter, to test the library. It has an auth module (Mongoose + JWT) and a product module (Mongoose + Zod). Covers signup/login and full CRUD, with validation on the query, params, and body.

## Documentation

Finding my way around it was easy. The writing is direct, no filler, and I didn't need to jump between five pages to understand the basics.

Installation was simple and direct too: `npm install ds-express-errors`, no peer dependency warnings, and it resolved fine under my project's `"type": "module"` setup.

One thing I liked that I haven't seen in every library's docs: a public roadmap page, laid out like a kanban board (planned / in progress). I ended up using it a lot while writing this review, to check which of the issues below the maintainer already knows about.

## What I actually used

- Global error handler (`errorHandler`), replacing a hand-rolled one
- Automatic Zod error mapping (body/params/query)
- Automatic JWT error mapping (`jsonwebtoken` errors)
- `Errors.*` presets (`NotFound`, `BadRequest`, `Unauthorized`) for custom app errors
- `asyncHandler`, fully migrated in both `product/*` (5 handlers) and `auth/*` (2 handlers)
- `initGlobalHandlers`/`gracefulHttpClose`, replacing my manual `SIGTERM`/`SIGINT` handler
- `customLogger` (`setConfig`), tested connecting my Pino logger. Didn't keep it wired in the final code, wanted to keep the repo lean.

## What worked well

`buildValidationError`, my old function that built a 400 error by hand with per-field details from a `ZodError`, is dead code now. Passing the raw `ZodError` straight to `next()` is enough, the library maps it automatically. Same story with `Errors.NotFound(...)` and `Errors.BadRequest(...)`: they worked as a drop-in replacement for my own error factory, no friction there.

Typecheck stayed clean through most of the migration too, no `.d.ts` friction, at least until I hit the `asyncHandler` problem (more on that below).

Zero dependencies. I confirmed this directly in the installed package's `package.json`, no `dependencies` field at all. Smaller supply-chain surface, worth something on its own.

The best result of the test came from breaking something on purpose: I killed the Mongo container while the server was running, mid-request. The resulting error (`MongoServerSelectionError`) isn't even in the library's list of named errors, and it still returned a clean 500 instead of hanging the request or crashing the process.

Graceful shutdown also checked out with a real signal, not just a read of the docs. Replaced my manual `SIGTERM`/`SIGINT` handling with `initGlobalHandlers` + `gracefulHttpClose`, it disconnects the DB and exits cleanly, no forced kill needed.

## Issues and things I'd change

I checked each of these against the public roadmap (ds-express-errors.dev/roadmap), tagged below. Only #2 felt like an actual bug to me, the rest are things the library just doesn't cover yet.

1. **No machine-readable error code.** `AppError` only has `message` and `statusCode`. No way to send something like `TOKEN_EXPIRED` to the frontend. I even tried attaching one by hand with `Object.assign`, still never reached the HTTP response. _(Roadmap: in progress.)_

2. **`Errors.*` presets look like middleware, but aren't.** If you use `app.use(Errors.NotFound)` by mistake instead of calling it inside a function, the request just hangs. No error, no log. TypeScript doesn't catch it either. This is the one I'd actually call a bug. _(Roadmap: planned.)_

3. **`asyncHandler` isn't generic.** My own `asyncHandler` could wrap handlers with an extended `Request` type. The library's version only accepts a plain `Request`. Affected almost every handler in `product.controller.ts`, not just the one using `.validatedQuery`. Worked around it with local casts that are only correct because Zod already validated the data, TypeScript itself can't prove it anymore. _(Roadmap: implied by the planned rewrite in TypeScript, this problem comes from hand-written `.d.ts` files sitting on top of plain JavaScript code.)_

4. **Logs every error the same way, no way to filter.** A normal 400 gets logged exactly like a real 500. Confirmed this from the source code, not just by not finding it in the docs. Only workaround is wrapping your own logger and filtering by `isOperational` yourself. _(Roadmap: in progress.)_

5. **Error logs don't share a request ID with the rest of my logs.** The library only attaches a `requestId` when one already exists on the incoming request:

    ```js
    ...(req?.headers?.['x-request-id'] ? {requestId: req?.headers?.['x-request-id']} : {})
    ```

    My own middleware generates an ID when the client doesn't send one, and stores it on `req.id` and the response header, not the incoming headers. Same request, tested live, two log lines, no shared ID:

    ```
    [ERROR] {"msg":{"url":"/v1/products/...","method":"GET"}}
    [INFO]  {"req":{"id":"0912bc67-...","method":"GET",...},"res":{...}}
    ```

    In production I couldn't search one ID and get the full story of a failed request. Fixable on my side, but it's real friction, and unlike the other four issues, nothing on the roadmap covers it.

Two smaller things: the generic message `"Validation error: validation error"` for an unrecognized `ZodError` is less useful than the per-field details I had before, and the response envelope uses `status: "fail"` for 4xx and `status: "error"` for 5xx (JSend-style) without documenting it anywhere. Neither breaks anything, not worth a full point off.

## Would I use this in production?

Yes, but mostly for a new project. My test was a migration, since I already had error handling built into my own API starter, and that's exactly where the friction showed up: the `asyncHandler` problem broke almost every handler I had. Starting from scratch avoids that. The `Errors.NotFound` hang is the one issue that would make me pause before shipping this to a team, since it fails silently with nothing telling you what went wrong. Everything else is a real but livable gap, and four of the five issues I found already have movement on the roadmap.

---

**Disclosure:** I received money compensation for independently testing ds-express-errors and providing my honest feedback. Payment was not dependent on whether my review was positive or negative.
