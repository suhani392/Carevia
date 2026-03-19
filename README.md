# Carevia

**Your Personal Healthcare Vault and AI Health Advisor.**

Carevia is a premium mobile experience designed to bridge the gap between complex medical data and patient understanding. It combines high-performance document management with a sophisticated multi-agent AI pipeline, ensuring health records are accessible, secure, and translated into clear, actionable insights.

---

## The Problem

Medical reports are often filled with dense jargon, making it difficult for patients to understand their own health status. This leads to:
* **Alert Fatigue**: Users receiving multiple, scattered notifications for the same medical event.
* **Language Barriers**: Patients struggling to interpret reports not written in their native language.
* **Dependent Vulnerability**: Family members (children or elderly) may have critical findings that go unnoticed by their caregivers.
* **Opaque AI**: "Black box" AI systems that provide answers without explaining how they reached their conclusions.

---

## The Solution: A Multi-Agent AI Pipeline

Carevia solves these issues through a coordinated network of specialized AI agents built on Supabase Edge Functions and Gemini 2.5 Flash-Lite.

### Architecture and Flow

1. **OCR Agent**: Extracts raw text from uploaded images or PDFs with high-precision medical scanning.
2. **Structuring Agent**: Maps unstructured text into standardized medical JSON, identifying test names, values, and reference ranges.
3. **Risk Agent**: Analyzes historical trends and current values to determine a risk level (Normal, High Risk, or Critical).
4. **Alert Agent**: Consolidates multiple critical findings into a single, summarized emergency notification to prevent alert fatigue.
5. **Family Agent**: Automatically identifies if the patient is a dependent and escalates critical alerts to linked family members/caregivers.
6. **Language Agent**: Translates technical medical explanations into the user's preferred native language (supporting Marathi, Hindi, Punjabi, Tamil, Gujarati, and Kannada).
7. **Guardrail Agent**: Ensures all explanations are safe, non-diagnostic, and follow strict medical safety protocols.
8. **Audit Agent**: Generates a detailed "System Audit Trail" for every analysis, providing full transparency on every agent's decision or why an agent was skipped.

---

## Impact

* **Clarity**: Translates complex lab values into simple, language-agnostic color-coded UI elements and plain-text explanations.
* **Safety**: Provides a safety net for families by ensuring critical health events are proactively communicated to the right people.
* **Trust**: The System Audit Trail allows users and doctors to see the exact reasoning process behind the AI's insights.
* **Efficiency**: Consolidates health data into a single vault with instant PDF viewing and smart sharing capabilities.

---

## Technical Stack

* **Frontend**: React Native (Expo) with a custom Judson typography system and high-performance native PDF rendering.
* **Backend**: Supabase (Auth, Database, Storage, and Edge Functions).
* **AI Engine**: Google Gemini 2.5 Flash-Lite (Multimodal).
* **State Management**: React Context API with persistent AsyncStorage for user preferences (Language and Theme).
* **Real-time**: Postgres Changes (CDC) for instant emergency alert dispatch.

---

## Setup Instructions

### 1. Prerequisites
Ensure your environment is configured for Native Android Development:
* **Node.js**: v20+ (LTS)
* **Android Studio**: Required for the Local Build workflow.
* **Java SDK (JDK)**: v17+ (Required for React Native 0.74+).
* **Supabase CLI**: Required for local edge function development.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/suhani392/Carevia.git

# Enter the project directory
cd Carevia

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add your Supabase credentials:
```text
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

### 4. Running the Application
Since Carevia uses native libraries (react-native-pdf, expo-camera), standard Expo Go is not supported. Use the Development Client:

#### Option A: Local Build (Recommended)
```bash
# Compile and install on Emulator/Device
npx expo run:android
```

#### Option B: Development Server
Once the native client is installed, start the bundler:
```bash
npx expo start --dev-client
```

### 5. Deploying AI Agents (Supabase)
```bash
# Login to Supabase
npx supabase login

# Deploy the multi-agent orchestrator
npx supabase functions deploy process-report
```

---

## Project Structure

```text
Carevia/
├── src/
│   ├── assets/                 # Custom Fonts (Judson) and Branding
│   ├── components/             # Navigation and UI Kits
│   ├── context/                # Global State (AppContext) and Navigation
│   └── screens/                # ScanReport, Family, Reports, Profile, etc.
├── supabase/
│   └── functions/              # Deno-based AI Agent Pipeline
├── App.tsx                     # Entry point and Global Alert Listener
└── app.json                    # Native Permissions and Config
```

---

## UI and Design Guidelines

* **Aesthetics**: Premium editorial medical design using the Judson font.
* **Spacing**: Large border radii (20px to 60px) for a modern, friendly feel.
* **Color System**: Primary gradient (#0062FF to #5C8EDF). High-risk items use Red, Borderline use Yellow, and Normal use Green across all languages.
