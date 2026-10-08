# Deployment and operations

## Build and run

1. Provision MongoDB (Atlas or a managed MongoDB service) and restrict network access to the backend.
2. Install the root npm workspace dependencies with `npm ci`.
3. Configure the backend environment from `backend/.env.example`. Set a randomly generated JWT secret of at least 32 characters; never commit `.env`.
4. Configure the exact frontend origin(s) in `CLIENT_URL`. Use HTTPS and an HTTPS `MONGO_URI`.
5. Configure optional AI, email, SMS, map and TURN integrations only when their terms and privacy practices have been reviewed.
6. Build with `npm run build`; deploy `frontend/dist` to a static HTTPS host and deploy `backend` to a Node.js 20+ host.
7. Configure the frontend's `VITE_API_URL` and `VITE_SOCKET_URL` at build time. These values are public, not secret.
8. Configure reverse-proxy WebSocket upgrades for Socket.IO and route React application paths to `index.html`.
9. Start the API with `npm start`; use `GET /api/health` for liveness. The process refuses to start without `MONGO_URI` and a 32-character `JWT_SECRET`.

The workspace's `npm run dev` is for local development. On deployment, serve the generated SPA and the API over HTTPS, preferably on the same site so `SameSite=Lax` HTTP-only cookies work as intended.

## Security checklist

- Use a unique high-entropy `JWT_SECRET`, least-privilege database credentials, encrypted database connections and restricted MongoDB network rules.
- Set `NODE_ENV=production`; keep secrets in the host's secret manager, never in Vite variables or static files.
- Set `CLIENT_URL` to exact trusted origins; do not use `*` with credentials.
- Terminate TLS at a trusted proxy; enforce HTTPS/HSTS at the edge and preserve Socket.IO upgrade headers.
- Configure a supported AI provider and review whether its request retention policies meet your requirements before transmitting user images.
- For TURN, configure coturn `use-auth-secret` and put the shared secret only in `TURN_SHARED_SECRET`. The API derives one-hour credentials for authenticated users. Never expose the shared secret as a frontend variable.
- Test password-reset email and Twilio SMS delivery in a provider test environment. BALA reports provider delivery status and does not promise emergency response.
- Create the first admin out of band after registration. Do not add public admin registration.
- Review backup, retention/deletion, abuse-reporting, consent and moderation procedures.

## WebRTC and browser access

The browser must be on HTTPS (or localhost) for camera, microphone and geolocation APIs. STUN can establish direct paths on many networks; configure a correctly authenticated TURN service for restrictive NAT/firewall environments. Verify camera/microphone permissions on at least two current browsers and networks before a live demonstration.

## Map provider

By default, the app uses OpenStreetMap tiles. `VITE_MAP_TILE_URL` and `VITE_MAP_ATTRIBUTION` allow a compatible provider. Review attribution, caching and traffic terms; do not assume a public tile endpoint provides a production service-level agreement.

## Verification before release

```powershell
npm ci
npm run test --workspace backend
npm run build
npm audit
```

Also run an authenticated integration suite against a disposable MongoDB database; verify `USER`, unverified `VOLUNTEER`, verified `VOLUNTEER` and `ADMIN` authorization boundaries; test socket reconnection and WebRTC cleanup; test accessibility with keyboard/screen readers; and smoke-test deployed cookie, CORS, WebSocket and HTTPS behavior. No production MongoDB or third-party AI/SMS credentials are included with the source.
