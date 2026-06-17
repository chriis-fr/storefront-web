# Fleetbase Storefront Web

Fleetbase Storefront Web is an open-source, self-hostable commerce frontend powered by the Fleetbase Storefront API. Fleetbase Console remains the back office for catalog, stores, networks, payments, orders, and operations; this project provides the public storefront that customers browse, customize, and checkout through.

Think of it as a themeable storefront layer for businesses that want Shopify-like launch speed while keeping Fleetbase as the headless commerce and logistics system of record.

## What It Includes

- Next.js App Router storefront with catalog, search, product detail pages, cart, checkout, account login, order history, sitemap, and robots routes.
- Server-side Fleetbase API proxy so `STOREFRONT_KEY` stays private.
- Delivery and pickup checkout flow with Fleetbase service quotes and order capture.
- Stripe-ready payment flow and gateway discovery.
- Theme tokens and presets for brand customization.
- Build-time plugin slots, client providers, and checkout/order hooks.
- Docker and Compose examples for self-hosted deployments.
- AGPL-3.0-only license for open-source network software use.

## Architecture

Fleetbase Storefront Web does not include an admin dashboard. The split is intentional:

- **Fleetbase Console:** manage products, stores, networks, customers, gateways, service quotes, fulfillment, and orders.
- **Fleetbase Storefront API:** headless API boundary used by this app.
- **Storefront Web:** public storefront, theming, plugin slots, checkout UX, SEO, and deployment surface.

The app calls Fleetbase from server-side route handlers in `app/api/storefront/*`. Browser code talks to local API routes, not directly to Fleetbase with the Storefront key.

## Quick Start

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Required configuration:

```bash
FLEETBASE_HOST=https://api.fleetbase.io
STOREFRONT_KEY=store_xxx_or_network_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For Stripe checkout, also set:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

Open `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `FLEETBASE_HOST` | Yes | Fleetbase API host. Defaults to `https://api.fleetbase.io` when omitted in local development paths. |
| `STOREFRONT_KEY` | Yes | Fleetbase Storefront key for a store or network. Never expose this to the browser. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public storefront URL used for metadata, sitemap, and redirects. |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | No | Default page locale. Defaults to `en`. |
| `NEXT_PUBLIC_DEFAULT_THEME` | No | Theme preset from `lib/theme`. Defaults to `default`. |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Recommended | Comma-separated image host allowlist for Next Image. Include your Fleetbase asset/CDN hosts. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | If using Stripe | Stripe publishable key used by browser checkout confirmation. |
| `NEXT_PUBLIC_PROMO_BANNER` | No | Example plugin banner text rendered above the header. |

## Self Hosting

Build and run with Docker:

```bash
docker build -t fleetbase/storefront-web .
docker run --env-file .env.local -p 3000:3000 fleetbase/storefront-web
```

Or use the example Compose file:

```bash
cp .env.example .env.local
docker compose -f docker-compose.example.yml up --build
```

Health checks are available at:

```text
/api/health
```

The health route validates required server-side settings and reports missing variables without exposing secrets.

## Themes

Theme presets live in `lib/theme/index.ts`. The selected theme comes from `NEXT_PUBLIC_DEFAULT_THEME` and is converted into CSS custom properties on the root layout.

Current presets:

- `default`
- `marketplace`
- `restaurant`

Add a new theme by adding a preset to `themes`, then set `NEXT_PUBLIC_DEFAULT_THEME` to its key.

## Plugins

Plugins are build-time TypeScript modules registered in `storefront.config.ts`. Runtime installation of arbitrary third-party code is intentionally out of scope for v0.1.

Plugins can provide:

- UI slot components.
- Client providers.
- Server hooks around checkout capture and order placement.

Current slots:

- `Header.before`
- `Header.after`
- `ProductCard.badges`
- `ProductDetail.afterOptions`
- `Cart.summary`
- `Checkout.paymentMethods`
- `OrderDetail.afterStatus`
- `Footer.columns`

Current server hooks:

- `beforeCheckoutCapture(payload)`
- `afterOrderPlaced(order)`

The included `promo-banner` plugin is a small example of a UI slot plugin controlled by environment configuration.

## Development

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run the full verification chain:

```bash
pnpm verify
```

## Roadmap

- Customer registration, password reset, logout/session status, saved addresses, and richer account management.
- Order detail and tracking pages once the public Storefront API endpoint contract is finalized.
- Catalog pagination, filters, sorting, collections, store profile pages, product slugs, and related products.
- Expanded payment plugin examples and analytics provider examples.
- End-to-end browser tests with mocked Fleetbase responses.
- Theme preview tooling and a documented theme package convention.
- Deployment recipes for common hosts and reverse proxies.

## License

Fleetbase Storefront Web is released under the GNU Affero General Public License v3.0 only. See [LICENSE](./LICENSE).
