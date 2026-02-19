---
description: How to create and run a Development Build (Dev Client)
---
# Development Build Workflow

Development builds are the best way to develop Expo apps because they allow you to use any native module while maintaining the fast iteration of Expo Go.

## 1. Prerequisites
- You must have an Expo account. If not, create one at [expo.dev](https://expo.dev).
- Install EAS CLI: `npm install -g eas-cli`
- Log in to EAS: `eas login`

## 2. Initialize EAS Build
Run this command in your terminal:
```bash
eas build:configure
```

## 3. Create the Development Build
This will create a custom version of the Expo Go app specifically for your project.

### For Android (APK):
```bash
eas build --profile development --platform android
```
- When asked if you want to use a development client, say **Yes**.
- Once finished, download the APK from the link provided and install it on your Android device/emulator.

### For iOS (Simulator):
```bash
eas build --profile development --platform ios --type simulator
```
- Download the resulting build and drag-and-drop it onto your iOS Simulator.

## 4. Running the Project
Once the custom app is installed on your device:
1. Start the development server:
   ```bash
   npx expo start --dev-client
   ```
2. Open the **Carevia** app (the custom one, not Expo Go).
3. Select your local server from the list.

## 5. Why use this?
- **Native Modules**: Everything we added (IntentLauncher, MediaLibrary, Sharing) works perfectly.
- **Stability**: It's a snapshot of your app's native code.
- **Production-Ready**: It's the closest thing to the version you'll put on the Play Store/App Store.
