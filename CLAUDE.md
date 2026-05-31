# Project Guidelines

## Verification

Every verification step (gsd-verifier, plan checker, manual review) MUST include running the actual build and test commands — not just static analysis of source files. Specifically:

- Run `pnpm build` (or the relevant package build) to confirm compiled output is current
- Run `pnpm test` or the relevant test suite to confirm tests pass
- If a verification gap is about build artifacts, the fix isn't verified until the build actually succeeds
