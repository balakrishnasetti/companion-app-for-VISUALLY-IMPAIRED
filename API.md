# BALA API reference

Base URL: `http://localhost:5000/api`. JSON requests use `{ success, data?, message?, errors? }`. Authentication is a `bala_token` HTTP-only cookie; send requests with credentials. The API also accepts a bearer token for trusted API clients. Users and admins are role-checked on protected routes.

## Authentication

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/auth/register` | Public, rate-limited | `name`, `email`, `password` (10–128 chars), optional `role` (`USER` or `VOLUNTEER`), optional `language` |
| POST | `/auth/login` | Public, rate-limited | `email`, `password`; sets an HTTP-only cookie |
| POST | `/auth/logout` | Signed in | Clears the cookie |
| GET | `/auth/me` | Signed in | Current safe user profile and preferences |
| POST | `/auth/forgot-password` | Public, rate-limited | Requires configured Resend delivery; sends an expiring, one-use link |
| POST | `/auth/reset-password` | Public, rate-limited | `token`, new `password` |

Passwords are bcrypt-hashed. Passwords and hashes are excluded from responses. Voice input only fills the ordinary credential fields and is never a substitute for password authentication.

## Users, preferences and voice

| Method | Path | Access |
|---|---|---|
| GET / PUT | `/users/me` | Signed in |
| PUT | `/users/preferences` | Signed in; language and accessibility settings |
| GET / POST | `/users/contacts` | Signed in; list or add a trusted contact |
| DELETE | `/users/contacts/:contactId` | Contact owner |
| POST | `/voice/command` | Signed in; receives locally transcribed text, returns a structured intent and records the intent, not the transcript. Audio is never sent to this endpoint. |
| GET / PUT | `/voice/settings` | Signed in |
| GET | `/voice/history` | Signed in; intent history |

Supported language codes: `en`, `te`, `hi`.

The push-to-talk voice assistant is available on every signed-in page and on the landing page's **Activate BALA** control. It recognizes requests for scene descriptions, obstacle checks, document/currency reading, volunteer help, hazard reporting and maps, location, navigation, SOS, dashboard, contacts, notifications, settings, the offline knowledge library and help. Common leading misrecognitions such as “mala” or “bye” are corrected to the BALA wake word. Say a short request after starting the microphone, then stop recording to process it. For example, “find a volunteer” reads out the available directory, while “connect me with a volunteer” opens the AI-first assistance flow. After the user consents to share the text request with the configured AI service, a reply is attempted; if it fails or does not arrive within 60 seconds, the request is created in the verified human-volunteer queue. The user can also request a human immediately, and accepted human requests open a private call automatically. “What is a dog?” opens the offline starter knowledge library. “Start navigation to the library” requests location permission and checks nearby hazard alerts for that destination. The navigation page offers a user-clicked Google Maps walking-directions link; Google receives the origin coordinates and destination only if that link is opened. “Stop navigation” clears the BALA navigation session. “Call my emergency contact” opens trusted contacts and requires the user to select and confirm a phone call. SOS and hazard reports are never sent simply by opening their pages. Camera capture, document selection, form details, location permission, SOS and phone calls require their relevant user action or confirmation. Transcription runs on-device; only the interpreted intent, not the transcript or audio, is sent to the voice-command API. A user separately consents before the text is sent to the AI provider.

## AI and documents

| Method | Path | Access | Request/behavior |
|---|---|---|---|
| POST | `/ai/scene-description` | Signed in | `{ image: "data:image/jpeg;base64,…", language? }` |
| POST | `/ai/obstacle-detection` | Signed in | Same image payload; uncertain visual alerts |
| POST | `/ai/document-reader` | Signed in | Same image payload; server-side image transcription if configured |
| POST | `/ai/currency-reader` | Signed in | Same image payload; never guesses illegible amounts |
| POST | `/documents` | Signed in | Explicitly save `{ name, text, language? }` OCR history |
| GET | `/documents` | Signed in | Owner's saved document list |
| GET / DELETE | `/documents/:id` | Document owner | Read or permanently delete one saved OCR result |

The frontend document reader uses local Tesseract.js OCR. Camera images are not saved to document history. AI keys remain on the API server.

## Volunteers, calls and real-time

| Method | Path | Access |
|---|---|---|
| GET | `/volunteers`, `/volunteers/availability` | Signed in; verified and currently available volunteers only |
| GET / PUT | `/volunteers/me`, `/volunteers/profile` | Volunteer; own verification/availability profile |
| PUT | `/volunteers/availability` | Verified volunteer; `AVAILABLE` or `OFFLINE` |
| POST | `/volunteers/ai-assist` | User; consented text prompt, answered by configured AI provider |
| POST | `/volunteers/requests` | User; idempotency key, language and topic |
| GET | `/volunteers/requests` | User's own or volunteer's waiting requests |
| PUT | `/volunteers/requests/:id/accept` | Verified, available volunteer |
| PUT | `/volunteers/requests/:id/cancel` | Request owner while waiting |
| POST | `/calls` | Call participant; fetch call associated with an accepted request |
| GET | `/calls`, `/calls/:id` | Call participant |
| GET | `/calls/ice-servers` | Signed in; expiring ICE/TURN configuration |
| POST | `/calls/:id/end` | Call participant |

Socket.IO events include `volunteer:request`, `volunteer:availability`, `volunteer:accepted`, `call:connected`, `call:ended`, `notification:new` and authenticated `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate` signaling. Signaling is limited to participants in an active call; audio/video media uses WebRTC peer connections.

Volunteer assistance is AI-first when the user explicitly consents and submits a text prompt. The AI response uses the configured `AI_API_KEY`, `AI_BASE_URL` and `AI_MODEL`; raw audio is never sent. If AI is unavailable, errors, returns no answer, or does not respond within 60 seconds, the server creates a request in the existing verified human-volunteer queue, even if the browser leaves the page while the AI is responding. A user can interrupt the AI attempt and create the same idempotent human request immediately. The text prompt is sent to the configured AI provider and is not stored in BALA's database.

## Hazards, navigation and offline sync

| Method | Path | Access |
|---|---|---|
| POST | `/hazards` | User; category, description, latitude and longitude |
| GET | `/hazards`, `/hazards/nearby` | Signed in; verified hazards; optional latitude, longitude and radius |
| PUT | `/hazards/:id` | Admin; `VERIFIED`, `REJECTED` or `RESOLVED` |
| POST | `/navigation/route` | User; destination plus explicitly shared current coordinates |
| GET | `/navigation/alerts` | User; explicitly supplied coordinates |
| DELETE | `/navigation/route` | User; stops and clears active navigation sessions |
| POST | `/offline/sync` | User; account-scoped `{ requestId, action, payload }` |

Offline sync actions: `HAZARD_REPORT`, `FEEDBACK`, `PREFERENCES`. A unique request ID prevents duplicate hazard/feedback records. Location is used only for the requested alert/report; BALA does not continuously track it.

Google Maps directions are generated as a user-initiated external link in the navigation page; no Google Maps API key or embedded Google map is used. BALA's backend route endpoint only records the destination and returns nearby hazard notices—it does not calculate or verify a route. The offline knowledge library is a limited English-language starter set bundled with the frontend; lookups require no network request.

## Notifications, SOS and feedback

| Method | Path | Access |
|---|---|---|
| GET | `/notifications` | Signed in; history and unread count |
| PUT | `/notifications/:id/read`, `/notifications/read-all` | Notification owner |
| POST | `/sos` | User; idempotent request ID and optional consented coordinates |
| GET | `/sos/history` | User; own events |
| POST | `/sos/:id/cancel` | SOS owner |
| GET | `/sos/admin` | Admin |
| POST | `/feedback` | User; rating for an ended call |
| GET | `/feedback` | User's records or admin moderation view |
| PUT | `/feedback/:id/moderate` | Admin |

SOS responses expose contact delivery status (`NOT_CONFIGURED`, `NO_CONTACTS`, `SENT`, `PARTIAL`, `FAILED`). An accepted SMS request is not an emergency dispatch or proof that a person received/read the text.

## Administration

All routes require role `ADMIN`; ordinary users receive `403`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/dashboard` | Counts and recent audited activity |
| GET | `/admin/users`; PUT `/admin/users/:id/status` | Account list and suspend/restore |
| GET | `/admin/volunteers`; PUT `/admin/volunteers/:id/verify` | Verification queue and decision |
| GET | `/admin/hazards`; PUT `/admin/hazards/:id/verify` | Community hazard review |
| GET | `/admin/feedback` | Feedback moderation queue |
| GET | `/admin/notifications` | Notification history |
| GET | `/admin/sos` | SOS event history |
| GET | `/admin/reports`, `/admin/audit-logs` | Audited activity |

## Error status

Validation errors return `400`, unauthenticated requests `401`, unauthorized roles `403`, missing records `404`, duplicate/idempotency conflicts `409`, unconfigured providers `503`, provider failures `502`, and timeouts `504`. Internal errors do not return stack traces.
