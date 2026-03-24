# Styx

Compliance infrastructure for tokenized real estate.

Every property deal — human or AI agent — must cross through compliance before closing. Styx automates that crossing.

## What It Does

Styx is a compliance API and on-chain attestation network built for real estate transactions. Deal data goes in. Verified compliance results come out. No PII stored on-chain.

Styx runs the checks that every closing requires — sanctions screening, identity verification, federal filing determinations, and jurisdiction-specific rules — and issues verifiable on-chain attestations that any platform, protocol, or agent can consume.

## This Repository

This repo contains the **public SDK, type definitions, and OpenAPI specification** for integrating with Styx.

```
spec/openapi.yaml     # OpenAPI 3.1 spec — 35 endpoints, full request/response schemas
sdk/                  # TypeScript client SDK with x402 payment handling
  src/client.ts       # StyxClient — handles 402 payment flow automatically
  src/types.ts        # Domain types (deals, compliance, title, escrow, settlement)
  src/index.ts        # Barrel exports
```

## Quick Start

```typescript
import { createStyxClient } from '@styx/sdk';

const styx = createStyxClient({
  apiUrl: 'https://api.styxsys.com',
  wallet: {
    address: '0x...your-wallet',
    privateKey: '0x...your-key',
    network: 'eip155:84532', // Base Sepolia (testnet)
  },
  verbose: true,
});

// Sanctions screening — $0.50 USDC
const { data, receipt } = await styx.screenSanctions({
  buyerAddress: '0x...',
  sellerAddress: '0x...',
});

console.log(data.overallCleared); // true
console.log(receipt.amount);      // 0.5
```

The SDK handles the full x402 payment flow: initial request, 402 response parsing, EIP-712 signing, payment retry, and receipt tracking.

## API Surface (35 endpoints)

| Category | Endpoints | Price |
|----------|-----------|-------|
| **Discovery** | health, pricing, openapi | Free |
| **Sanctions** | screening | $0.50 |
| **Compliance** | base, commercial, high-value, full | $10–$25 |
| **Legal** | check | $15 |
| **Brokerage** | check | $8 |
| **Lending** | prequalify | $5 |
| **KYC** | risk-assessment, full check | $5–$12 |
| **FIRPTA** | determine, calculate | $3–$8 |
| **FinCEN RRE** | determine, report, file, status | $1–$50 |
| **ERC-3643** | issue-claims, verify-claim | $0.50–$15 |
| **Attestations** | explorer | $0.10 |
| **Deal Pipeline** | create, advance, close, audit | $5–$50 |
| **History** | wallet, property, entity | $1 |
| **Onboarding** | validate-token, title, lending, brokerage | Free (invite-gated) |

Full spec: [`spec/openapi.yaml`](spec/openapi.yaml) or `GET /api/v1/openapi` on any running instance.

## Authentication

Two modes:

- **x402** — Pay-per-request in USDC on Base. The SDK handles this automatically. Designed for AI agents and programmatic access.
- **API Keys** — `X-API-Key` header. Enterprise partners get volume pricing. Sandbox keys (`styx_test_*`) available via the developer portal.

## Verticals

**Title & Settlement** — FinCEN RRE filing, FIRPTA withholding, OFAC screening, disclosure validation.

**Tokenization Platforms** — Compliant identity and regulatory checks for tokenized asset issuance and transfers.

**AI Agents** — Autonomous agents pay per request and receive compliance results. No accounts, no human in the loop.

**Proptech & Closing Platforms** — Drop compliance into any transaction workflow via API.

**Brokerage & Lending** — Counterparty screening, jurisdiction checks, and regulatory determinations.

**Legal & Escrow** — Structured compliance outputs for attorneys and escrow officers.

## Integrations

Built on [Chainlink CRE](https://docs.chain.link/chainlink-functions), [Chainlink ACE](https://chain.link/use-cases/compliance), and GLEIF [vLEI](https://www.gleif.org/en/vlei/introducing-the-verifiable-lei-vlei). ERC-3643 compatible for tokenized securities.

## Status

Private pilot. API docs and integration guides available to partners.

## Get In Touch

- Website: [styxsys.com](https://styxsys.com)
- Twitter: [@styxsys](https://x.com/styxsys)
- Email: [hello@styxsys.com](mailto:hello@styxsys.com)

## License

MIT
