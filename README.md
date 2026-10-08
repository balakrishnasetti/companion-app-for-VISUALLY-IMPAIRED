# BALA — AI Accessibility Companion

BALA is a MERN accessibility application for visually impaired people. It brings a voice-first assistant, image descriptions, document OCR, community-verified hazard reports, volunteer video calls, navigation alerts, trusted contacts, SOS, and an administrator workspace into one accessible web app.

The application is organized as a Vite/React frontend and an Express/Mongoose backend. The backend uses HTTP-only JWT cookies, role authorization, MongoDB, and Socket.IO. WebRTC carries call media; Socket.IO carries call signaling only.

## What is implemented

- English, Telugu, Hindi and Spanish language preferences. Spanish is supported by translated core dashboard/navigation labels, offline speech recognition, Spanish OCR, voice intent routing, AI language prompts and saved preferences. Speech synthesis uses the browser's available `es-ES` voice when installed.
- Offline speech recognition automatically detects English, Telugu, Hindi or Spanish from the spoken command, independently of the selected interface language. BALA continues to speak responses in the selected language.
- An app-wide push-to-talk assistant available from every signed-in page. It corrects common wake-word transcription errors, opens feature pages, performs supported actions, and speaks confirmations and results; external actions such as SOS and phone calls remain user-confirmed.
- Normal and voice-assisted credential entry. Voice is never used as authentication; passwords are not spoken or saved as recordings.
- Camera/image-based scene, obstacle, currency and bill analysis through a server-side OpenAI-compatible vision API. Results are explicitly uncertain and are never presented as safety guarantees.
- On-device English, Telugu, Hindi or Spanish document OCR using Tesseract.js. Images and recognized text are not saved unless the user explicitly saves document history.
- Volunteer registration, admin verification, availability and weekly schedule, request queue, WebRTC video calls, call history and session ratings. Consented text requests can be answered by the configured AI helper first. If the AI service fails or does not answer within 60 seconds, the request is sent to the verified human-volunteer queue; users can also request a human immediately. Human acceptance opens the private call.
- Hazard reports, administrator review, verified-hazard map and opt-in geolocation alerts. The map uses configurable OpenStreetMap-compatible tiles.
- An offline starter knowledge library for common animals, plants, non-living materials and natural resources, with voice-searchable spoken explanations.
- Opt-in Google Maps walking directions from the shared current location and a named destination, alongside BALA's separate nearby hazard alerts.
- Trusted contacts, SOS history, optional Twilio SMS, real-time in-app notifications and an explicit warning that BALA does not dispatch emergency services.
- Protected admin statistics and views for accounts, volunteers, hazards, feedback, notifications, SOS events and audit logs.
- An account-scoped IndexedDB queue for eligible hazard reports, completed-call feedback and preferences, with idempotency keys and a cached app shell.
- Semantic controls, visible focus states, keyboard navigation, responsive layouts, scrollable app navigation, large text, high contrast and reduced motion settings.
- A short, skippable eye-illustration intro on the landing page, with a deep-space palette, blue iris, pulsing glow, stars and restrained lightning. The eye blinks naturally in the intro and on the landing page. The landing, sign-in and signed-in app screens share a blue-black Milky Way theme with colorful blue, violet, pink, teal and amber stars, glowing headings, animated buttons and eye-mark branding. The intro runs once per browser tab session, finishes in under seven seconds, and is bypassed when reduced motion is preferred.
- A separate, muted login welcome intro plays a cropped segment of the supplied video from after its opening insect shot. Playback is capped at 8.5 seconds, skippable, runs once per browser tab, and is bypassed for reduced-motion preferences.

External capabilities require configuration. AI image analysis and AI volunteer replies need `AI_API_KEY`; the AI volunteer also uses the configured `AI_BASE_URL` and `AI_MODEL`. Password recovery needs Resend credentials; SOS text messages need Twilio; production WebRTC on restrictive networks may need coturn REST credentials. Missing services return a clear error or deliver the assistance request to the human queue rather than fabricating an AI response.

To enable image analysis locally, add a valid API key for an OpenAI-compatible vision provider to `AI_API_KEY` in `backend/.env` (alongside `AI_BASE_URL` and `AI_MODEL` if your provider uses different values), then restart the backend. Keep this server key out of frontend environment variables and source control.

## Requirements

- Node.js 20 or later
- npm 10 or later
- MongoDB 6 or later, locally or through MongoDB Atlas

Camera, microphone and geolocation access require a secure context: use `localhost` in development and HTTPS in production.

## Local setup (Windows PowerShell)

From this folder:

```powershell
npm install
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Set `MONGO_URI` and a private random `JWT_SECRET` of at least 32 characters in `backend\.env`. Start MongoDB, then run both applications:

```powershell
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. The Express API listens on `http://localhost:5000`; its liveness endpoint is `GET /api/health`.

The development command runs the API and Vite in parallel. A valid MongoDB URI is required for the API to start; health and authorization tests do not require a database.

## Environment configuration

See [`backend/.env.example`](./backend/.env.example) and [`frontend/.env.example`](./frontend/.env.example) for the complete variable list. Never commit `.env` files or place server secrets in `VITE_*` variables.

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Private signing key, at least 32 characters |
| `CLIENT_URL` | Exact allowed frontend origins; comma-separated for multiple origins |
| `AI_API_KEY` | Private server-side vision API key |
| `AI_BASE_URL`, `AI_MODEL` | OpenAI-compatible API base and vision model |
| `RESEND_API_KEY`, `MAIL_FROM` | Optional one-time password-reset email delivery |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Optional SOS SMS delivery to the user's trusted contacts |
| `TURN_URLS`, `TURN_SHARED_SECRET` | Optional coturn REST endpoint and shared signing secret; the API issues one-hour credentials |
| `VITE_API_URL`, `VITE_SOCKET_URL` | Browser-visible API and Socket.IO origins |
| `VITE_MAP_TILE_URL`, `VITE_MAP_ATTRIBUTION` | Optional frontend map tile provider and required attribution |

The default map uses OpenStreetMap tiles and its attribution. Respect the selected provider's usage policy before a public deployment. Do not use a long-lived TURN username/password: the backend derives expiring credentials from the coturn shared secret.

## Create the first administrator

Public registration intentionally allows only `USER` and `VOLUNTEER` roles. Register the administrator account, then promote that account directly in MongoDB using a trusted operator session:

```javascript
use bala_accessibility
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "ADMIN" } }
)
```

Sign out and back in for the new role to take effect. Administrators can verify volunteer profiles and community hazard reports from `/app/admin`.

## Run, test and build

```powershell
npm run test --workspace backend
npm run build
npm audit
```

The Node test suite covers voice intent mapping, Spanish/Telugu/Hindi commands, supported-language validation, image validation, health, request validation, authentication gates and safe 404 responses. Database-backed flows should additionally be exercised against a disposable MongoDB database before deployment.

## Documentation

- [API reference](./API.md)
- [Database models and data handling](./DATA_MODEL.md)
- [Deployment and operational checklist](./DEPLOYMENT.md)

## Important limitations

- BALA does not continuously monitor for a wake word. Speech recognition starts only after the user presses a voice control; background/mobile wake-word support needs a native layer.
- Voice control is push-to-talk, not continuous hands-free listening. Press **Activate BALA**, speak a short command, and press **Stop listening**; BALA then opens a feature or operates labeled controls on the current page. Examples include “describe my surroundings,” “open settings,” “read this screen,” “scroll down,” “focus field destination,” “type the library into destination,” “select pothole for hazard category,” “open camera,” “take a photo,” “ask BALA,” and “activate button submit report.” Say “confirm” to proceed with actions that send, save, call, report, or delete; say “cancel that” to cancel a pending action. Password fields cannot be dictated. Camera use requires browser permission, while file pickers and some native dialogs still require a direct tap or browser confirmation.
- On-device speech recognition performance depends on the device, available memory, and browser audio support. Voice controls have visible, keyboard-accessible alternatives.
- Spanish support is being rolled out in phases. Core dashboard/navigation labels, speech, OCR, AI prompts and saved preferences support Spanish now; remaining fixed interface copy and feature instructions still fall back to English while further Spanish localization is completed.
- OCR needs a network connection the first time a language's recognition data is downloaded. OCR runs in the browser; camera source images are not stored by BALA.
- Offline speech recognition downloads its multilingual Whisper model the first time you use voice features. The model is cached by your browser; audio transcription then runs on your device and the audio is not sent to BALA or a speech-recognition service. You need an internet connection for the initial model download and enough device memory to run it. Voice capture is push-to-talk, with a 15-second limit per recording.
- AI descriptions, obstacle detection, currency extraction and community reports can be wrong or incomplete. Use ordinary mobility aids and verify financial details.
- BALA's nearby hazard alerts are not turn-by-turn directions. Google Maps provides walking directions only after the user opens its link; BALA cannot verify step-free access, route accessibility or safety. Opening Google Maps shares the entered destination and current coordinates with Google.
- The offline knowledge library is a limited, English-language starter set, not a complete encyclopedia or camera-based object identifier. It does not send lookups to a service.
- Volunteer video calls need camera/microphone permission and working peer connectivity. Configure coturn for networks that cannot connect using STUN alone.
- SOS records an event and can attempt to text configured trusted contacts. It does not contact or dispatch emergency services.
- The application does not store documents unless the user chooses “Save to history.” Saved OCR text can be deleted by its owner.
