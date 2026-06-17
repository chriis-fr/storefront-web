# Contributing

Thanks for helping improve Fleetbase Storefront Web.

## Development Setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Use a Fleetbase Storefront key from a development store or network. Do not commit real keys, customer data, or production environment files.

## Before Opening a Pull Request

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Keep changes focused. Storefront Web is the customer-facing storefront; Fleetbase Console remains the admin and management surface.

## Plugin and Theme Changes

- Keep plugin contracts backward compatible when possible.
- Document new slots, hooks, or theme tokens in `README.md`.
- Add focused tests for plugin hook behavior and any shared rendering contract.

## License

By contributing, you agree that your contributions are licensed under AGPL-3.0-only.
