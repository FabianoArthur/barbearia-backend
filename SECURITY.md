# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's
[private vulnerability reporting](../../security/advisories/new) for this repository
instead. You should get a first answer within a few days.

## What the API already does

- Auth tokens live in `httpOnly` cookies (`Secure` in production), with a CSRF
  double-submit token for cookie-authenticated writes. Bearer tokens are also accepted.
- `JWT_SECRET` (32+ chars) and `ENCRYPTION_KEY` are required at startup. There are no
  insecure fallbacks, and JWTs are pinned to HS256.
- CPF and phone numbers are encrypted at rest (AES-256-GCM) and masked in API responses
  and in the WhatsApp provider logs.
- Global rate limit (20 req/min per IP by default), stricter limits on the public
  confirm/cancel/reschedule endpoints, helmet security headers, and strict DTO validation
  (`whitelist` + `forbidNonWhitelisted`).

## Known limitation

`POST /auth/register` lets the caller choose any role, including `SUPER_ADMIN`, because the
companion frontend creates staff accounts through it. It is **closed by default when
`NODE_ENV=production`**. Only set `ALLOW_PUBLIC_REGISTRATION=true` on a deployment you
control. The planned fix is an authenticated user-creation endpoint.

Tenant scoping is enforced for finance, payments and expenses (staff can only query their
own establishment). Other listings, such as appointments and clients by establishment, do
not check it yet. That is tracked as follow-up work.
