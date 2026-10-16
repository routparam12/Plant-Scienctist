# Plant Scientist 🌱
## MVP Technology & Cost Plan

**Version:** 0.1  
**Date:** 24 September 2026  
**Goal:** Build and validate the Plant Scientist MVP with the lowest practical initial cost.

---

## 1. Executive Summary

Plant Scientist should be built as a **cross-platform mobile application + lightweight API backend**, with expensive AI capabilities kept behind replaceable provider interfaces.

The initial objective is **not** to build a large production infrastructure. The objective is to prove that farmers can use the product repeatedly and that the diagnosis/voice experience is useful at an acceptable cost.

### Recommended initial stack

- **Mobile:** React Native (Expo + TypeScript) *(Migrated from Flutter)*
- **Web/SEO:** Next.js
- **Backend:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL (Supabase / Managed PostgreSQL)
- **Queue:** Redis + Celery/ARQ/RQ
- **Object storage:** Supabase Storage / S3-compatible private storage with signed URLs
- **Knowledge base:** ICAR pathology database + vector search
- **AI:** Provider abstraction for STT, TTS, vision and LLM (Gemini 2.5 Flash / Edge TTS)
- **Authentication:** Passwordless Email/Phone OTP
- **Voice:** Push-to-talk multilingual assistant (Hindi, Marathi, English)
- **Deployment:** Start locally with adaptive endpoint discovery, move to low-cost cloud hosting
- **Future channel:** WhatsApp using the same backend

---

# 2. What Can Be Built for ₹0

A large part of the MVP can be developed without paying for cloud services.

## Development

The following can be developed locally for free:

- Flutter application
- Android Studio
- Android emulator
- FastAPI backend
- PostgreSQL
- Redis
- Docker
- SQLite for offline mobile data
- Unit and integration tests
- Local RAG pipeline
- Local vector database
- Mock AI providers
- Diagnosis workflow
- Chat workflow
- Crop profiles
- Camera integration
- Microphone recording
- Offline upload queue
- Image compression
- Push-to-talk voice flow
- Admin/evaluation tooling

### ₹0 development architecture

```text
Flutter App
     |
     v
FastAPI
     |
     +---- PostgreSQL
     |
     +---- Redis
     |
     +---- Local Object Storage
     |
     +---- Mock AI Providers
     |
     +---- Local RAG
```

This allows most of the product experience to be built before spending money on AI APIs or cloud infrastructure.

---

# 3. What Starts Costing Money

The biggest variable cost is **AI usage**, not FastAPI or Flutter.

A real diagnosis may involve:

```text
Photo
  ↓
Vision model
  ↓
Reasoning
  ↓
Agronomy retrieval
  ↓
Translation
  ↓
Text-to-speech
```

Voice interactions can additionally require:

```text
Audio
  ↓
Speech-to-text
  ↓
LLM
  ↓
Text-to-speech
```

Therefore the main unit-economics formula is:

```text
Cost per interaction
=
STT
+ Vision/LLM
+ Translation
+ TTS
+ Storage
+ Infrastructure
```

The exact amount will depend on the selected vendors, models, usage and current pricing.

---

# 4. Recommended Development Strategy

## Phase 0 — ₹0

Build the complete product flow using mock providers.

### Mobile

- Home
- Crop dashboard
- Add crop
- Camera/photo capture
- Voice recording
- Chat
- Diagnosis result
- Follow-up questions
- Weather screen
- Weekly briefing
- Settings
- Language selection

### Backend

- Authentication
- User profiles
- Crop management
- Media uploads
- Conversations
- Diagnosis jobs
- Results
- Feedback
- Briefings
- Weather proxy
- Alerts
- Expert escalation

### AI

Use mock implementations:

```python
class STTProvider:
    async def transcribe(self, audio):
        raise NotImplementedError
```

```python
class MockSTTProvider(STTProvider):
    async def transcribe(self, audio):
        return "My tomato leaves are curling"
```

The application can therefore be tested without consuming paid API credits.

---

# 5. Provider Abstraction

Every external AI service should sit behind an interface.

```text
providers/
├── stt/
│   ├── base.py
│   ├── mock.py
│   └── sarvam.py
│
├── tts/
│   ├── base.py
│   ├── mock.py
│   └── sarvam.py
│
├── llm/
│   ├── base.py
│   ├── mock.py
│   └── gemini.py
│
├── vision/
│   ├── base.py
│   └── multimodal.py
│
├── weather/
│   ├── base.py
│   └── imd.py
│
└── storage/
    ├── base.py
    └── s3.py
```

This prevents vendor lock-in.

For example:

```text
Mock STT
   ↓
Sarvam STT
   ↓
Another STT provider
```

can happen without changing the mobile application.

---

# 6. MVP Architecture

```text
                    🌱 PLANT SCIENTIST

                         Flutter
                            |
                            v
                      FastAPI API
                            |
          +-----------------+-----------------+
          |                 |                 |
          v                 v                 v
      PostgreSQL          Redis          Object Storage
          |                 |
          |              Workers
          |                 |
          +-----------------+
                    |
                    v
             AI Provider Layer
          +---------+---------+
          |         |         |
         STT       LLM       TTS
          |         |         |
          +---------+---------+
                    |
                    v
                Agronomy RAG
```

---

# 7. Core API

## Authentication

```text
POST /v1/auth/otp/request
POST /v1/auth/otp/verify
POST /v1/auth/refresh
```

## User

```text
GET   /v1/me
PATCH /v1/me
```

## Crops

```text
GET    /v1/crops
POST   /v1/crops
PATCH  /v1/crops/{id}
DELETE /v1/crops/{id}
```

## Media

```text
POST /v1/media/uploads
POST /v1/media/{id}/complete
```

Media should be uploaded directly to object storage using presigned URLs.

## Voice

```text
POST /v1/voice/transcribe
POST /v1/voice/speak
WS   /v1/voice/stream
```

The WebSocket endpoint should be **Phase 2**, not MVP.

## Chat

```text
POST /v1/conversations
POST /v1/conversations/{id}/messages
GET  /v1/conversations/{id}/stream
```

## Diagnosis

```text
POST /v1/diagnoses
GET  /v1/diagnoses/{id}
POST /v1/diagnoses/{id}/answers
POST /v1/diagnoses/{id}/feedback
```

## Briefings

```text
GET /v1/briefings/latest?crop_id=
```

## Weather

```text
GET /v1/weather?lat=&lon=
```

## Alerts

```text
POST /v1/devices
GET  /v1/alerts
```

## Expert escalation

```text
POST /v1/escalations
```

## Operations

```text
GET /healthz
GET /internal/*
```

---

# 8. Diagnosis Flow

The MVP should use **push-to-talk**, not realtime voice.

```text
Farmer
  |
  +---- Photo
  |
  +---- Voice/Text
          |
          v
   Presigned Upload
          |
          v
 POST /v1/diagnoses
          |
          v
      Job Queue
          |
          v
     Background Worker
          |
          +---- STT
          |
          +---- Photo Quality Check
          |
          +---- Crop Context
          |
          +---- RAG Retrieval
          |
          +---- Multimodal LLM
          |
          +---- Guardrails
          |
          +---- Confidence Check
          |
          +---- Follow-up / Escalation
          |
          +---- Translation
          |
          +---- TTS
          |
          v
      Stored Result
          |
          v
    App Notification/Poll
```

---

# 9. Why Push-to-Talk First?

Realtime voice sounds attractive, but it increases complexity.

For the MVP:

```text
Record
  ↓
Upload
  ↓
Transcribe
  ↓
Reason
  ↓
Speak
```

Benefits:

- More reliable on weak networks
- Easier to debug
- Easier to cache
- Easier to control AI costs
- Easier to implement offline queues
- Simpler backend
- Lower operational complexity

Realtime streaming can be added later.

---

# 10. Database

Start with PostgreSQL.

Core entities:

```text
users
profiles
crops
crop_events
media
conversations
messages
diagnoses
diagnosis_answers
diagnosis_feedback
briefings
weather_cache
devices
alerts
escalations
provider_usage
evaluation_cases
```

Important fields should include:

- created_at
- updated_at
- user_id
- crop_id
- request_id
- provider
- model
- latency
- token/usage information
- estimated cost
- prompt version
- result version

This makes later cost and quality analysis possible.

---

# 11. Storage

Do not send large photos/audio files through FastAPI.

Use:

```text
App
 ↓
FastAPI requests presigned URL
 ↓
Object Storage
 ↓
App uploads directly
 ↓
FastAPI receives completion event
```

Benefits:

- Lower backend bandwidth
- Faster uploads
- Lower server load
- Better scalability

Images should be compressed before upload.

---

# 12. AI Cost Control

Plant Scientist should have an **AI Router**.

```text
                  User Request
                       |
                       v
                  AI Router
                       |
          +------------+------------+
          |            |            |
          v            v            v
       Simple        Voice       Diagnosis
       Question       STT        + Image
          |            |            |
          v            v            v
      Cheap/Cache     STT       Strong Vision
          |                       Model
          +-----------+-----------+
                      |
                      v
                   Response
```

Do not send every question to the most expensive model.

### Example

Question:

> What is NPK?

Possible path:

```text
RAG/Cache
   ↓
Small/cheap model
```

Question:

> My tomato leaves have brown spots. What disease is this?

Possible path:

```text
Image
+
Crop
+
Symptoms
+
Location
      ↓
Multimodal model
      ↓
Agronomy RAG
      ↓
Guardrails
      ↓
Diagnosis
```

---

# 13. Guardrails

Safety rules should be implemented in code, not only in prompts.

Examples:

- Confidence threshold
- Pesticide/dosage limits
- Product-specific restrictions
- Crop-stage validation
- Missing-context checks
- Escalation rules
- Human expert review
- Unsafe recommendation detection

Example:

```text
Diagnosis confidence < threshold
            |
            v
      Ask follow-up
            |
            +---- Still uncertain
                      |
                      v
              Human escalation
```

---

# 14. Cost Stages

## Stage 0 — Development

**Target:** ₹0

Use:

- Local PostgreSQL
- Local Redis
- Local storage
- Mock AI
- Local RAG
- Flutter
- FastAPI
- Docker

Goal:

> Complete the application without depending on paid APIs.

---

## Stage 1 — Real AI Prototype

**Indicative budget:** ₹1,000–₹5,000 for experimentation.

Connect:

- One STT provider
- One LLM/vision provider
- One TTS provider

Test with:

- Real farmer audio
- Real crop photographs
- Different accents
- Field noise
- Multiple Indian languages

The exact amount depends on provider pricing and model usage.

---

## Stage 2 — Small Pilot

**Indicative infrastructure + API budget:** ₹2,000–₹10,000/month.

Target:

```text
10–100 testers
```

Potential costs:

- Backend hosting
- PostgreSQL
- Redis
- Object storage
- AI API usage
- Domain
- Monitoring

Avoid overengineering at this stage.

---

## Stage 3 — 1,000+ Active Users

At this stage, unit economics becomes the priority.

Track:

```text
AI cost / diagnosis
AI cost / active farmer
Storage cost / farmer
Infrastructure cost / farmer
Monthly revenue / farmer
Gross margin / farmer
```

Before scaling aggressively, optimize:

- Model selection
- Prompt size
- Image compression
- Audio compression
- Caching
- RAG retrieval
- Request routing
- Rate limits
- Provider fallback

---

# 15. Publishing Costs

## Android

Development and direct APK testing can be done without publishing costs.

Google Play publishing requires a developer account fee.

**Known fee:** $25 one-time.

## iOS

Apple Developer Program generally costs:

**$99/year**

Therefore:

> Do not make iOS publishing a requirement for the first MVP.

Build the Flutter application so iOS can be added later.

---

# 16. Things NOT to Spend Money On Yet

Avoid these during the first MVP:

- Kubernetes
- GPU servers
- Enterprise AWS architecture
- Expensive managed vector databases
- Realtime voice
- WhatsApp integration
- Dedicated ML infrastructure
- Complex observability platforms
- Large-scale cloud architecture
- Multiple paid AI providers simultaneously

The first objective is **product validation**, not infrastructure sophistication.

---

# 17. Recommended Project Structure

```text
plant-scientist-api/
├── app/
│   ├── main.py
│   ├── core/
│   ├── api/
│   │   └── v1/
│   ├── schemas/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── providers/
│   ├── rag/
│   └── workers/
│
├── eval/
├── tests/
├── migrations/
├── Dockerfile
├── docker-compose.yml
└── README.md
```

Architecture:

```text
Routers
   ↓
Services
   ↓
Repositories / Providers
   ↓
External Systems
```

Routers should remain thin.

---

# 18. MVP Success Metric

The most important early question is not:

> Can we build the AI?

It is:

> **Will farmers repeatedly use Plant Scientist because it gives them useful answers?**

A useful early experiment:

```text
50 farmers
     ↓
Track usage
     ↓
Track diagnosis success
     ↓
Track repeat usage
     ↓
Track feedback
     ↓
Measure cost per farmer
```

The target should eventually become:

```text
Useful product
+
Acceptable AI cost
+
Repeat usage
=
Scalable Plant Scientist
```

---

# 19. Immediate Build Order

## Sprint 1

### Mobile

- Flutter setup
- Navigation
- Design system
- Home screen
- Crop screen
- Chat screen
- Diagnosis screen

### Backend

- FastAPI setup
- PostgreSQL
- SQLAlchemy
- Pydantic
- Authentication skeleton
- Health endpoint

---

## Sprint 2

### Media

- Camera
- Image compression
- Presigned uploads
- Object storage
- Audio recording

### Backend

- Media endpoints
- Crop APIs
- Conversation APIs

---

## Sprint 3

### Diagnosis

- Diagnosis job
- Redis queue
- Worker
- Mock STT
- Mock LLM
- Structured diagnosis schema
- Follow-up questions
- Feedback

---

## Sprint 4

### Real AI

Replace mocks with:

```text
Mock STT → Real STT
Mock LLM → Real LLM
Mock TTS → Real TTS
```

Benchmark:

- Accuracy
- Latency
- Cost
- Language quality
- Field-noise performance

---

# 20. Initial Budget Philosophy

The preferred strategy is:

```text
                COST
                  |
                  |
        ₹0        |████████████████
                  | Development
                  |
      ₹1–5k       |████
                  | AI experiments
                  |
     ₹2–10k/mo    |████████
                  | Small pilot
                  |
                  |          Scale only
                  |          after validation
                  +---------------------------->
                         USER GROWTH
```

Do not spend ₹50,000–₹1,00,000 building infrastructure before proving the core product.

---

# 21. Final Recommendation

### Build for free first.

The first version should be:

```text
Flutter
+
FastAPI
+
PostgreSQL
+
Redis
+
Object Storage
+
Mock AI
+
Local RAG
```

Then introduce real AI providers one at a time.

### The guiding principle

> **Build the product architecture as if it will scale, but pay for infrastructure only when usage proves that it needs to scale.**

The architecture should therefore make expensive services **replaceable**, while the user experience remains stable.

---

## Final Framework Decision

### Selected: React Native (Expo + TypeScript)

The team evaluated Flutter vs. React Native and finalized **React Native (Expo SDK 54, React Native 0.76+) with TypeScript**:

- **Rationale:** Rapid iteration cycles, strong ecosystem for custom UI styling, modular component architecture, active device debugging via Expo Go / development builds, and seamless sharing of TypeScript data types between web and mobile interfaces.
- **Iconography & Styling:** Lucide Icons (`lucide-react-native`) and curated modern tokens in `THEME` (no rigid utility overhead).
- **Media & Hardware:** Expo Camera and Expo ImagePicker with direct multipart upload to FastAPI.

---

## One-line architecture decision

> **React Native (Expo) + FastAPI + PostgreSQL (Supabase) + Redis + Private Object Storage + Provider-Abstracted AI (Gemini 2.5 Flash / Edge TTS), with strict farmer-first, user-centric data models.**

---

# 11. Migration & Implementation Progress Log (Up Until Now)

### 11.1 Mobile Stack Migration (Flutter ➔ React Native)
- **Status:** **Completed**
- **Changes Executed:**
  - Deprecated legacy Flutter client codebase in `app/mobile_app/`.
  - Built full cross-platform application in `mobile-app/` using Expo SDK 54, React Native 0.76+, and TypeScript.
  - Implemented multi-lingual localization system in `src/constants/translations.ts` supporting **English (`en`)**, **Hindi (`hi`)**, and **Marathi (`mr`)**.
  - Built custom component hierarchy: `CradleBottomNav`, `CropCard`, `CropDetailModal`, `DiagnosticScannerModal`, `VoiceAssistantModal`, `AddCropModal`, and `OnboardingLoginModal`.
  - Configured Android physical device debugging via USB with `adb reverse tcp:8000 tcp:8000`, Android cleartext traffic (`android:usesCleartextTraffic="true"`), and multi-fallback adaptive network client.

---

### 11.2 Product & Domain Model Evolution (Farmer-Centric Architecture)
- **Status:** **Completed**
- **Problem with Initial Design:**
  - Traditional agriculture apps force smallholder farmers to fill complex multi-step forms (farm name, village, survey number, exact GPS acreage, soil survey) before they can even ask a question or track a plant.
  - Hardcoded growth stage percentages (e.g. "Flowering 40%") and artificial health scores (e.g. "95/100") created visual contradictions with real crop biology.
- **Architectural Shift:**
  - **Crops Belong Directly to the User:** Land/farm boundaries are completely optional and deferred. A farmer can track a plant even if they only have 2 backyard tomato plants.
  - **Zero-Friction Crop Creation:** Crops are created from actions farmers already take:
    1. **Leaf Scan:** AI diagnosis auto-detects crop identity and presents a 1-tap *"Add to My Crops"* button.
    2. **Voice Query:** Farmer mentions their crop to the AI voice doctor, creating a tracked crop.
    3. **Manual Quick Chips:** Intuitive timing chips (*Today, 1 week ago, 2 weeks ago, 1 month ago, Don't know*) rather than requiring calendar date math.
  - **Pure Computed Growth Stages:** Dropped hardcoded database columns (`stage`, `stage_progress`, `health_score`, `status`). The backend dynamically computes current growth stage, days growing, cycle percentage, and days to harvest based on Indian Standard Time (IST) and crop catalog duration intervals. If planted date is missing, progress is honestly reported as `null` (*"Planted: not set"*).

---

### 11.3 Backend Engineering & Security Hardening
- **Status:** **Completed**
- **Key Enhancements in `Backend/`:**
  - **Strict JWT Authentication:** Kept strict `audience="authenticated"` token validation against Supabase JWKS with asymmetric key caching. Rejecting insecure bypasses (`verify_aud=False`) to prevent forged tokens.
  - **PostgreSQL Database Schema (`schema.sql`):**
    - `crops` catalog with duration-aligned stages (`stages jsonb`) where stage sums strictly equal `growth_duration_days`. Added crop aliases (`aliases text[]`) for colloquial names (e.g. *Tamatar*, *Gehun*).
    - `farm_crops` simplified to user-centric ownership (`user_id`, `custom_name`, `variety`, `planted_date`, `source`, `notes`).
    - `farm_crop_tasks` with ISO timestamp due dates (`due_at`) and priority levels.
    - `diagnoses` updated with `farm_crop_id`, `crop_suggestion`, and `resolved_at` resolution tracking.
  - **Batch Querying & Zero N+1 Queries:** Rewrote `crop_service.py` to fetch user crops, tasks, and diagnoses in bulk batch queries with explicit `user_id` filtering on every operation to prevent data leaks across users (since server-side Supabase secret key bypasses Postgres RLS).
  - **Fail-Fast Error Architecture:** Removed silent fake fallback farms/crops ("Chandaka Farm", fake 14.5 acres). DB failures return explicit HTTP 503 (`UpstreamError`) or 404 (`NotFound`), with resilient client handling.
  - **Private Object Storage with Signed URLs:** Implemented `storage_service.py` using private Supabase bucket `crop-images`. Images are securely stored and delivered to client via short-lived signed URLs.
  - **AI Diagnostics & Voice:** Integrated Google Gemini 2.5 Flash for multimodal leaf pathology with ICAR treatment guidelines, and Microsoft Edge TTS for natural multilingual audio advisory in Hindi, Marathi, and English.

---

### 11.4 Mobile Networking & Hardware Integration
- **Status:** **Completed**
- **Issues Resolved:**
  - **`java.net.ConnectException` over LAN:** Solved physical Android device connectivity issues by developing an adaptive endpoint discovery mechanism in `apiClient.ts` that tries reverse-tethered `localhost:8000`, LAN IP (`192.168.1.36:8000`), and emulator loopback (`10.0.2.2:8000`).
  - **Android Cleartext Policy:** Enabled cleartext traffic for local development in both `android/app/src/main/AndroidManifest.xml` and `app.json`.
  - **PGRST205 Schema Cache Graceful Handling:** Prevented app crashes if the Supabase SQL migration has not yet been executed by handling PostgREST missing table errors safely in `profile_service.py`.

---

### 11.5 Detailed Implementation Progress Across Phases

| Phase | Description | Key Modules / Components | Status |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Audit & Infrastructure** | Dependency cleanup, API client with adaptive endpoint discovery, multilingual translations (`en`, `hi`, `mr`). | **Completed** |
| **Phase 1** | **Authentication & Onboarding** | Passwordless Email OTP request & verify (`/v1/auth/otp/request`, `/v1/auth/otp/verify`), `OnboardingLoginModal.tsx`, `authStorage.ts` session persistence. | **Completed** |
| **Phase 2** | **User-Centric Data Model & Storage** | Refactored `schema.sql`, `crop_progress.py` (IST computed stages), `storage_service.py` (signed URLs), flat `/v1/crops` API endpoints. | **Completed** |
| **Phase 3** | **Crop Detail Screen & Timeline** | `CropDetailModal.tsx`: Stage stepper timeline, care tasks with filters/checkboxes, diagnosis history with signed image previews, and "Mark Resolved / Mark Active" issue toggle (`resolveDiagnosis`). | **Completed** |
| **Phase 4** | **App-to-API Screen Wiring & Scanner** | `Crop.tsx`: Connected to live `getUserCrops()`, zero-crops empty state, active portfolio carousel, ICAR pathology library. `HomeScreen.tsx`: Connected to user crops and detail modal. `DiagnosticScannerModal.tsx`: Crop attachment selection and 1-tap "Add to My Crops" card. `App.tsx`: Automatic screen refresh on crop creation. | **Completed** |
| **Phase 5** | **Offline Sync & SQLite Queue** | Local SQLite offline cache for tasks and offline diagnosis queue. | *Scheduled Next* |
| **Phase 6** | **Voice Module Live Integration** | Streaming microphone audio with voice response playback. | *Scheduled Next* |
| **Phase 7** | **Production Cloud Deployment** | Docker deployment on low-cost cloud runner with Redis. | *Scheduled Next* |

---

### 11.5b Onboarding & Routing Architectural Blueprint
- **Status:** **Completed**
- **Architecture Flow:**
  1. **Supabase (Auth Only):** Handles OTP generation and email dispatch. Creates the Supabase auth user record on verification.
  2. **FastAPI (`POST /v1/auth/otp/verify`):** Verifies OTP with Supabase, queries the `public.profiles` table for `user.id`, and returns an explicit `is_new_user: boolean` flag (`true` if profile row does not exist or lacks core details/onboarding_completed).
  3. **Frontend Routing:**
     - `OnboardingLoginModal.tsx` passes `(user, is_new_user)` to `onLoginSuccess`.
     - In `App.tsx`, if `is_new_user === true`, it triggers the lightweight bottom sheet `QuickSetupModal.tsx` (*"What should we call you? What do you grow?"*).
     - Farmers can enter their name, location, and tap crop chips (Tomato, Wheat, etc.) which auto-creates user crops, or tap **"Skip for now"** for zero-friction immediate access to `HomeScreen.tsx`.
     - If `is_new_user === false`, the app skips setup and routes straight to `HomeScreen.tsx`.

---

### 11.6 Quality Assurance & Verification Status
- **Mobile TypeScript Verification:** `npx tsc --noEmit` runs with **0 errors**.
- **Backend Unit Testing:** `test_crop_progress.py` and `test_crops_api.py` run with **100% pass rate**.
- **Supabase Integration:** Migration script prepared in [Backend/supabase/schema.sql](file:///d:/ML/Plant-Scienctist/Backend/supabase/schema.sql) ready for 1-click execution in Supabase SQL Editor.

