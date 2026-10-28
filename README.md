# URL Shortener

A simple URL shortener service built with Express and SQLite.

## Stack

- Node.js, Express 4
- better-sqlite3 (SQLite)
- Jest + Supertest for tests

## Installation

```bash
npm install
```

## Run

```bash
npm start
```

Server runs on port 3000 by default (override with `PORT`).

## Test

```bash
npm test
```

## API

Shorten a URL:

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/some/path"}'
```

Redirect via short code:

```bash
curl -i http://localhost:3000/ABC123
```

Stats for a short code:

```bash
curl http://localhost:3000/stats/ABC123
```

## Project structure

```text
url-shortener/
├── src/
│   ├── server.js
│   ├── routes.js
│   └── db.js
├── public/
├── tests/
│   └── api.test.js
├── data/
└── package.json
```
