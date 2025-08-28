
# PolyVerse Task Tracker

## M1 Milestone Tasks

- [x] **M1-1**: Finalize PVP schema + Ed25519 in packages/pvp-sdk-js with tests
- [x] **M1-2**: Relay (Go) POST/GET/WS + signature verification + basic policy
- [x] **M1-3**: Indexer (TS/Fastify + Meilisearch) with cursoring
- [x] **M1-4**: Two feed bundles + /explain (time_decay_diversity, community_weighted)
- [x] **M1-5**: Web MVP: keys (dev-custodial + non-custodial), compose/reply, follow/like, bundle selector, profiles
- [ ] **M1-6**: Seed script: 20 demo users, 500 posts, multilingual content, labels, follows

## M2 Milestone Tasks

- [ ] **M2-1**: Moderation v1: labeler registry+API, client filters (keyword, mute/block, NSFW), signed appeals log format
- [ ] **M2-2**: AI Mesh: services/ai-router (/chat,/summarize); agents/summarizer-agent and onboarding-agent
- [ ] **M2-3**: Observability: OTel traces/logs for relay/indexer/ai-router

## M3 Milestone Tasks

- [ ] **M3-1**: Payments v1: Lightning regtest tips + fee hooks + .env.example
- [ ] **M3-2**: Bridge-APub echo (Actor, inbox/outbox ↔ PVP post) + mapping docs for AT/Nostr

## Development Experience

- [x] **DX-1**: docker-compose with NATS, Meilisearch, MinIO, LND regtest; demo scripts
- [ ] **DX-2**: CI (lint/test/build) + CODEOWNERS + PR checks

## Documentation

- [x] **DOCS-1**: Docs: ARCHITECTURE, PROTOCOL, MODERATION, AI_MESH, PAYMENTS, ROADMAP (update for M1–M3)
