# 🌿 Plant Scientist Mobile App

An AI-powered, multilingual mobile application built for farmers and agricultural managers to monitor crop health, diagnose plant diseases using AI vision, receive smart weather & spray advisories, and consult certified agronomists.

---

## 🚀 Key Features

### 1. 🏡 Intelligent Home Dashboard (`HomeScreen.tsx`)
* **Personalized Greeting & Location**: Contextual time-of-day greetings in local languages and real-time farm location.
* **Quick Access Capsule**: One-tap access to voice assistant queries and camera diagnostics.
* **Agronomy Toolkit**: Quick actions for AI Doctor, Soil Health testing metrics, Satellite Farm Mapping, and Expert Consultation.
* **Smart Weather & Spray Advisory**:
  * Real-time temperature, humidity, and wind metrics.
  * IMD radar rain alerts and 7-day spray suitability calendar.
  * Chemical & organic dosage recommendations based on upcoming rain and wind forecasts.
* **Crop Portfolio Management**: Filter active crops by category (*Tomato, Wheat, Cotton, Garden, etc.*) and track growth stages.
* **Priority Field Tasks**: High and medium-priority field care tasks (e.g., spraying, irrigation, fertilization).

---

### 2. 🩺 Crop Pathology & AI Doctor (`Crop.tsx` & `DiagnosticScannerModal.tsx`)
* **Instant AI Plant Diagnosis**: Photograph crop leaves or upload gallery images for real-time pathology analysis.
* **Disease & Pest Database**: Comprehensive details for Fungal, Viral, Bacterial, and Pest issues.
* **Dual Treatment Plans**: Step-by-step guidance for both **Organic** remedies and **Chemical** treatments with precise dosage instructions.
* **Preventive Measures**: Actionable advice to protect adjacent crops from cross-infection.

---

### 3. 🎙️ Multilingual Voice Assistant (`VoiceAssistantModal.tsx`)
* **Voice Queries in Local Languages**: Ask farming questions via voice in Hindi, Marathi, or English.
* **Speech-to-Text & AI Synthesis**: Powered by backend STT/TTS modules for natural conversational interaction.

---

### 4. 👨‍🌾 Certified Agronomist Consultations (`AppointmentScreen.tsx`)
* **Expert Directory**: Browse certified agricultural specialists with ratings, qualifications, experience, and fee structures.
* **Flexible Consultation Modes**: Book Video Calls, Voice Calls, or In-Field Farm Visits.
* **Booking Management**: Track scheduled, confirmed, and past consultations.

---

### 5. 👤 Farmer Profile & Localization (`ProfileScreen.tsx` & `OnboardingLoginModal.tsx`)
* **Multilingual Support**: Seamlessly switch between **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
* **Farm & Soil Details**: Manage farm acreage, soil types, district/village location.
* **Secure OTP Authentication**: Passwordless login using email OTP and persistent JWT token storage.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Framework** | [React Native](https://reactnative.dev/) v0.86 with [Expo SDK 57](https://docs.expo.dev/) |
| **Language** | TypeScript v6.0 |
| **Icons & UI** | `lucide-react-native`, `expo-linear-gradient`, `react-native-svg` |
| **Media Handling** | `expo-image-picker` for camera & gallery capture |
| **Storage & Auth** | `@react-native-async-storage/async-storage` for local state & JWT persistence |
| **Backend Integration** | Custom REST & Multipart client connecting to FastAPI backend |

---

## 📁 Project Structure

```
mobile-app/
├── App.tsx                      # Root App component, routing & global modals
├── app.json                     # Expo configuration
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript compiler configuration
├── AGENTS.md                    # AI development guidelines & conventions
└── src/
    ├── components/              # Reusable UI components & Modals
    │   ├── AddCropModal.tsx            # Modal to register new crop entries
    │   ├── CradleBottomNav.tsx         # Bottom tab navigation bar with floating AI camera button
    │   ├── CropCard.tsx                # Crop status & progress card component
    │   ├── DiagnosticScannerModal.tsx  # Camera & gallery AI disease scanner
    │   ├── OnboardingLoginModal.tsx    # OTP login & authentication modal
    │   └── VoiceAssistantModal.tsx     # Voice query assistant modal
    ├── constants/
    │   └── theme.ts             # Theme palette, typography, and spacing
    ├── data/
    │   └── mockData.ts          # Offline specimen data & agronomist directory
    ├── screens/
    │   ├── HomeScreen.tsx              # Main dashboard with weather & advisories
    │   ├── Crop.tsx                    # Pathology database & AI diagnostic center
    │   ├── AppointmentScreen.tsx       # Agronomist discovery & booking
    │   └── ProfileScreen.tsx           # Farmer profile, language & farm settings
    ├── services/
    │   ├── apiClient.ts         # REST API client with multipart upload & LAN IP fallback
    │   └── authStorage.ts       # Secure local storage helper for JWT session tokens
    └── types/
        └── index.ts             # TypeScript definitions & data interfaces
```

---

## 🔌 API & Networking Configuration

The mobile app connects to a FastAPI backend server for AI diagnosis, voice processing, profile management, and farm data.

### Environment Variable Setup
Create a `.env` file in the `mobile-app` root directory:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.36:8000
```

> ⚠️ **Mobile Device Note**: When running on a physical Android or iOS device over WiFi, replace `192.168.1.36` with your development PC's actual local WiFi LAN IP address. Physical devices cannot resolve `localhost` or `127.0.0.1`.

---

## ⚡ Getting Started

### Prerequisites
* Node.js (v18+) or Bun
* Expo Go app on your physical device, or an Android/iOS Emulator

### Installation & Launch

1. **Install Dependencies**:
   ```bash
   npx expo install
   ```

2. **Start the Expo Development Server**:
   ```bash
   npx expo start
   ```

3. **Run on Emulator / Device**:
   * **Android Emulator**: Press `a` in the terminal.
   * **iOS Simulator**: Press `i` in the terminal (macOS only).
   * **Physical Device**: Scan the QR code using the **Expo Go** app.

---

## 🧪 Code Quality & Verification Commands

Before submitting code, ensure linting and type checks pass:

```bash
# Type check TypeScript files
npx tsc --noEmit

# Run Expo diagnosis
npx expo-doctor

# Fix dependency version incompatibilities
npx expo install --fix
```

---

## 📱 Building & Deployment with EAS

Build binaries using Expo Application Services (EAS):

```bash
# Development Build
npx eas-cli@latest build --profile development --platform android

# Production Build
npx eas-cli@latest build --profile production --platform android
```

---

## 📄 License

This project is licensed under the MIT License.
