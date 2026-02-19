# Carevia 🩺

**Your Personal Healthcare Vault & AI Health Advisor.**

Carevia is a premium mobile experience designed to bridge the gap between medical data and patient understanding. It combines high-performance document management with AI-driven insights, ensuring your health records are always accessible, secure, and understandable.

## ✨ Why Carevia?

- **Smart Medical Vault**: Store and view high-resolution PDF health reports with zero lag.
- **AI-Powered Insights**: An integrated assistant to help decode complex medical jargon (Styling Ready).
- **Family First**: Manage health profiles for your entire family and receive real-time health updates.
- **Instant Security**: Export and share reports securely via native system protocols.

---

## 🚀 Getting Started

### 1. Prerequisites
Before you begin, ensure your machine is ready for **Native Android Development**:
- **Node.js**: v20+ (LTS)
- **Android Studio**: Required for the Local Build workflow.
- **Java SDK (JDK)**: v17+ (Crucial for React Native 0.74+).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/suhani392/Carevia.git

# Enter the project directory
cd Carevia

# Install dependencies
npm install
```

### 3. The Workflow (Local First)
Since Carevia uses high-performance native libraries (like `react-native-pdf`), **standard Expo Go cannot be used.** You have two choices for running the app:

#### ✅ Choice A: Local Build (Better & Faster)
If you have Android Studio installed, this is the best way. It compiles the app on your computer.
```bash
# Compile and install the app on your Emulator/Device
npx expo run:android
```
*Use this whenever you add a new library with `npx expo install`.*

#### ☁️ Choice B: Cloud Build (EAS)
If your computer is slow or you don't have Android Studio, you can use Expo's servers.
```bash
# Install EAS CLI
npm install -g eas-cli

# Build in the cloud (requires Expo account)
eas build --profile development --platform android
```

### 4. Daily Development
Once the app is installed on your device (using either method above), simply run the dev server to start coding:
```bash
npx expo start --dev-client
```

---

## 🛠️ Tech Stack & Key Features

- **Professional PDF Engine**: Built with `react-native-pdf` & `react-native-blob-util`. It handles large medical files with ease.
- **Media Library Sync**: Automatically saves filtered reports to a custom "Carevia Reports" album.
- **Typography**: Features the **Judson** font family for a premium, editorial medical aesthetic.
- **Navigation**: Custom `NavigationProvider` for fluid between-screen transitions.

---

## 📂 Project Structure

```text
Carevia/
├── src/
│   ├── assets/                 # Custom Fonts (Judson) & Category-specific Icons
│   ├── components/             # Navigation, Drawers, and UI Blocks
│   ├── context/                # AppContext (App Logic) & Navigation Context
│   └── screens/                # DocumentView, Family, AI-Bot, Reports, Profile, etc.
├── App.tsx                     # Entry point
└── app.json                    # Expo & Permissions configuration
```

## 🤖 AI Development Guidelines

1.  **Strict Styling**: Adhere to the "Large Radius" design (20px to 60px) and primary gradient (#0062FF → #5C8EDF).
2.  **Safety First**: Use the `isBusy` state on all native interactions (Sharing/Downloading) to prevent UI blocking.
3.  **Local Dev Only**: Do not attempt to test new features in Expo Go; they will crash due to missing native modules.
