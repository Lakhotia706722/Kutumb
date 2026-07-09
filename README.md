# Kutumb — Family Life Operating System

India's family life OS. One proactive feed. One family vault. Never miss a renewal.

## Phase status

- [x] Phase 1 — Foundation & Family Account System
- [ ] Phase 2 — Document Vault
- [ ] Phase 3 — Smart Alert Engine
- [ ] Phase 4 — Unified Family Feed
- [ ] Phase 5 — Inheritance Readiness Score
- [ ] Phase 6 — Polish & Hardening

## Local development

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)

### Backend

```bash
cd backend
cp .env.example .env      # edit as needed
npm install
npm run dev               # starts on :5000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev               # starts on :3000
```

Open http://localhost:3000

## Project structure

```
kutumb/
├── backend/
│   ├── src/
│   │   ├── config/      # DB connection
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/  # Auth guard
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # Express routers
│   │   ├── utils/       # JWT helpers
│   │   └── server.js
│   └── .env.example
└── frontend/
    ├── app/             # Next.js App Router pages
    ├── components/      # Shared UI components
    ├── context/         # React context (auth)
    ├── lib/             # API client + typed helpers
    └── .env.example
```
