# @dutyclaims/privacy-core

Open-source privacy layer for DutyClaims. This package contains all code that touches plaintext user data. It is the only code users need to audit to verify DutyClaims privacy guarantees.

## What this package includes

- **crypto** -- Client-side encryption primitives: device identity (RSA-OAEP key pairs), AES-GCM channel key management (wrap/unwrap), message encryption/decryption, file encryption/decryption, and base64/hex encoding utilities.
- **redaction** -- Deterministic PII redaction using pattern matching. Detects and replaces emails, phone numbers, SSNs, tax IDs, claim numbers, policy numbers, and account numbers with stable placeholders.
- **auth** -- Anonymous authentication primitives: PBKDF2 passphrase derivation (600k iterations, OWASP recommendation), salt generation, recovery key generation and hashing, and privacy-preserving email hashing.
- **byom** -- Bring Your Own Model adapter: a streaming client for OpenAI-compatible chat completion APIs. Supports OpenAI, Anthropic, Ollama, and custom endpoints.
- **utils** -- Timestamp coarsening utilities for metadata minimization. Reduces timestamp precision to hour or day granularity.

## Installation

```bash
pnpm add @dutyclaims/privacy-core
```

## Usage

Import from the main entry point or from specific subpaths:

```typescript
// Main entry point (re-exports everything)
import { encryptMessage, redactText, derivePassphraseKey } from "@dutyclaims/privacy-core";

// Subpath imports
import { createDeviceIdentity, createChannelKey } from "@dutyclaims/privacy-core/crypto";
import { redactText } from "@dutyclaims/privacy-core/redaction";
import { derivePassphraseKey, generateSalt } from "@dutyclaims/privacy-core/auth";
import { createBYOMAdapter } from "@dutyclaims/privacy-core/byom";
import { coarsenTimestamp } from "@dutyclaims/privacy-core/utils";
```

## Building

```bash
pnpm build
```

This runs `tsc` and outputs to the `dist/` directory with declaration files and source maps.

## Testing

```bash
pnpm test
```

Tests use the Node.js built-in test runner (`node:test`) with `tsx` for TypeScript execution. All cryptographic operations use the Web Crypto API (`crypto.subtle`), which is available in Node.js 18+ and all modern browsers.

## Verifying the build

To verify that the published package matches the source:

1. Clone this repository.
2. Run `pnpm install` and `pnpm build` in `packages/privacy-core/`.
3. Compare the `dist/` output against the published package contents.
4. Run `pnpm test` to confirm all cryptographic round-trips and redaction rules pass.

## Security model

This package is designed so that:

- Encryption keys are generated and managed client-side. The server never sees plaintext content.
- Passphrases are derived using PBKDF2 with 600,000 iterations before leaving the client. The server should re-hash with bcrypt or argon2id before storage.
- PII redaction happens before data is sent to any LLM or stored server-side.
- Timestamps are coarsened to reduce metadata exposure.
- The BYOM adapter sends requests directly from the client to the user's chosen model provider, keeping API keys client-side.

## License

Apache-2.0. See the LICENSE file for full terms.

Copyright 2024-2026 DutyClaims.
