# 0004. Local server on raw Node `http`, no web framework

- **Status:** Accepted
- **Date:** 2026-05-15

## Context

Layer 2 (see ADR-0001) is a small local server. Its whole job:

- Serve roughly a dozen `LanternApi` endpoints.
- Persist the notebook and observations to files.
- Bridge the Workshop to a local Ollama process.

It runs on `localhost`, for a single user, on port 5181. It is started
alongside Vite by `npm run dev`. It is not, and is not intended to be,
a public multi-user backend.

## Decision

Implement the server on **raw Node `http`**, in ESM, with **no web
framework** — no Express, no Fastify, no Koa. Routing, CORS, and body
parsing are written by hand in `server/server.mjs`.

The result: `package.json` has **three runtime dependencies**, all of
them React (`react`, `react-dom`, `react-router-dom`). The server adds
zero.

## Consequences

**Good**

- No server dependency tree to audit, patch, or keep current.
- Fast cold start; nothing to initialize but the `http` module.
- The whole server is small and readable end to end — the request
  surface is a dozen routes, and all of them are visible in one file.

**Costs**

- Routing, CORS handling, and JSON body parsing are hand-rolled. They
  are simple, but they are ours to get right.
- No middleware ecosystem — auth, rate limiting, logging would all be
  hand-built if ever needed.
- This decision is **scoped to the local-first server**. A hosted
  multi-user build (see `CONTRACTS.md` §8) would likely revisit it; at
  that point persistence also moves off `store.mjs` to a database, so
  the framework question is best reopened together with that work.

## Alternatives considered

- **Express / Fastify.** Rejected for the local server: a dependency
  and lockfile surface, and a patch cadence, in exchange for routing
  sugar over a dozen `localhost` routes. The local-first design wants
  the server thin and dependency-free; a framework is the right call
  only once the server becomes a real hosted backend.
