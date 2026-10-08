# BALA data model and privacy

MongoDB models are separated by responsibility. Passwords are bcrypt hashes; private collections are accessed through authenticated, owner-scoped queries. MongoDB creates indexes from schema declarations on connection.

| Collection/model | Key fields and relationships |
|---|---|
| `User` | Name, unique normalized email, private password hash, role (`USER`, `VOLUNTEER`, `ADMIN`), account status |
| `UserPreference` | Unique user reference, language and accessibility display/speech preferences |
| `TrustedContact` | Owner user, private contact name, phone and relationship |
| `Volunteer` | Unique volunteer user, supported languages, skills, weekly local-time schedule, availability, verification, aggregate rating |
| `VolunteerRequest` | Requesting user, optional accepted volunteer, status, language/topic and globally unique idempotency key |
| `CallSession` | Assistance request, user/volunteer participants, call state and connected/ended timestamps |
| `Hazard` | Private reporter reference, GeoJSON point, category, report text/status and optional idempotent offline request key; a `2dsphere` index supports nearby queries |
| `HazardVerification` | Hazard, administrator/moderator, decision, moderation note and timestamp |
| `NavigationSession` | Owner, destination label and active flag; the current coordinates are not persisted |
| `Notification` | Owner, event type, message, read timestamp and small related-resource metadata |
| `SOS` | Owner, idempotency key, status, contact-delivery state and optional coordinates shared by the user |
| `Feedback` | User, volunteer, completed call, rating/comment; unique call reference prevents duplicate session ratings |
| `Document` | Owner, user-chosen document name and explicitly saved OCR text/language |
| `OCRResult` | Owner, unique saved-document reference, language and text length metadata |
| `VoiceCommand` | Owner, structured intent and language only; no recognized transcript or raw audio |
| `AuditLog` | Actor, action, resource kind/identifier and limited moderation metadata |
| `OfflineSync` | Owner, unique request ID, action and created resource identifier |

## Data-flow and retention notes

- **Credentials:** raw passwords are used only during registration/login/reset validation. Bcrypt hashes are not selected by default and are never returned. JWTs are held in an HTTP-only cookie.
- **Voice:** speech recognition runs locally in the browser using a cached model. Audio is not uploaded. When online, the server receives the recognized phrase only to parse an intent; it stores the intent, not the phrase or audio recording.
- **Images/OCR:** image analysis is sent to the configured AI provider through the backend. Local Tesseract OCR runs in the browser. No source image is saved. Extracted OCR text is only persisted when the user explicitly saves it; delete it through the document API.
- **Locations:** browser geolocation is requested after a user action. Hazard-report coordinates are part of the report; SOS coordinates are optional; navigation coordinates are used for a query and are not written to `NavigationSession`.
- **Offline:** eligible report, feedback and preference payloads are temporarily stored in account-partitioned IndexedDB on that device and removed after successful sync. Sign-in tokens and source images are never queued. Avoid shared/public devices.
- **Calls:** signaling messages are relayed only to the other call participant; media is peer-to-peer WebRTC and is not recorded by BALA.
- **External delivery:** trusted-contact SMS is optional and uses configured Twilio credentials. Password reset email is optional and uses a short-lived, hashed reset token through Resend.

Administrators should establish a retention policy for hazard reports, SOS records, audit logs and deleted-account data before production deployment. Configure MongoDB access controls, backups and encrypted transport/storage for the deployment environment.
