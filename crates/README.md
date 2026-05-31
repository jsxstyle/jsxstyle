# jsxstyle SWC Transform

Rust-based SWC transform for extracting static styles from jsxstyle components at build time.

## Layout

This is a JS monorepo, so all Rust code and its configuration are kept self-contained
in this `crates/` directory rather than at the repo root:

- `crates/Cargo.toml` — the Cargo workspace root
- `crates/Cargo.lock`
- `crates/rust-toolchain.toml` — pins the Rust toolchain
- `crates/jsxstyle-swc-core/` and `crates/jsxstyle-swc-napi/` — the member crates

Keeping these here (instead of at the repo root) avoids scattering Rust tooling files
across a predominantly JavaScript repository.

**Run all `cargo`/`napi` commands from `crates/` (or a subdirectory).** `rust-toolchain.toml`
is resolved from the current working directory, so running cargo from the repo root would use
your machine's default toolchain instead of the pinned one. The `pnpm` scripts below `cd` into
the right directory for you; prefer them, and `cd crates` first if you run cargo by hand.

## Prerequisites

Install Rust via [rustup](https://rustup.rs):

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

The pinned toolchain in `rust-toolchain.toml` is installed automatically the first time you
run `cargo` from this directory.

## Common tasks (from the repo root)

| Command                        | What it does                                              |
| ------------------------------ | --------------------------------------------------------- |
| `pnpm build:rust`              | `cargo build` (debug)                                     |
| `pnpm build:rust:release`      | release build                                             |
| `pnpm build:napi`              | build the native Node addon (release)                     |
| `pnpm test:napi`               | build the debug addon + run the smoke test                |
| `pnpm dev:rust`                | watch + rebuild (requires `cargo install cargo-watch`)    |
| `pnpm generate:rust-constants` | regenerate `generated_constants.rs` from `@jsxstyle/core` |

Each of these runs cargo from `crates/`, so the pinned toolchain applies.

## Lint & format

These are shared with the JS side and **auto-fix by default** — you should never
need to format by hand:

| Command          | What it does                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `pnpm format`    | auto-format everything: `oxfmt` (JS) + `cargo fmt` (Rust)                                 |
| `pnpm check:fix` | auto-fix everything: lint (`oxlint --fix`, `cargo clippy --fix`) + format                 |
| `pnpm check`     | read-only verification (what CI enforces): lint + `--check` format + `clippy -D warnings` |

`pnpm format:check` is the format-only read-only variant. To test: `cd crates && cargo test`.

## Crates

| Crate               | Purpose                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `jsxstyle-swc-core` | Shared transform logic (SWC visitor). Used by the NAPI addon.          |
| `jsxstyle-swc-napi` | Node.js native addon via NAPI-RS. Exposes `transform()` to JavaScript. |
