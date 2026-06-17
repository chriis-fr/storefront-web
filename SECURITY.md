# Security Policy

## Supported Versions

Security fixes target the latest released version of Fleetbase Storefront Web.

## Reporting a Vulnerability

Please report security issues privately by emailing security@fleetbase.io. Do not open a public GitHub issue for vulnerabilities.

Include:

- Affected version or commit.
- Reproduction steps.
- Impact and expected behavior.
- Any relevant logs, screenshots, or proof-of-concept details.

We will acknowledge reports as quickly as possible and coordinate fixes before public disclosure.

## Security Notes for Operators

- Keep `STOREFRONT_KEY` server-side only.
- Serve production deployments over HTTPS.
- Set a strict `NEXT_PUBLIC_IMAGE_HOSTS` allowlist for product and storefront images.
- Rotate Storefront keys if they are exposed.
- Review plugins before enabling them; plugins run as trusted application code.
