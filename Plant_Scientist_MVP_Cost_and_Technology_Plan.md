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

- **Mobile:** Flutter
- **Web/SEO:** Next.js
- **Backend:** FastAPI
- **Database:** PostgreSQL
- **Queue:** Redis + Celery/ARQ/RQ
- **Object storage:** S3-compatible storage
- **Knowledge base:** Local vector DB initially, managed vector storage later if required
- **AI:** Provider abstraction for STT, TTS, vision and LLM
- **Authentication:** Phone OTP
- **Voice:** Push-to-talk for MVP
- **Deployment:** Start locally, then move to low-cost cloud hosting
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

## Next Decision

Before implementation, decide the mobile framework:

### Option A — Flutter

Best fit if the priority is:

- Custom UI
- Animations
- Glass cards
- Voice UI
- Waveforms
- Camera interactions
- Android now + iOS later

### Option B — React Native

Best fit if the team already has strong:

- JavaScript
- TypeScript
- React
- React Native

### Recommended choice

**Flutter**, unless the existing team is significantly stronger in TypeScript/React Native.

---

## One-line architecture decision

> **Flutter + FastAPI + PostgreSQL + Redis + Object Storage + provider-abstracted AI, starting with mock AI and moving to paid APIs only after the core UX is validated.**
