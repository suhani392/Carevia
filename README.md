# Carevia - Healthcare Assistant Mobile App

Carevia is a premium React Native mobile application built with Expo, focusing on seamless healthcare management, AI-driven analysis, and family health tracking.

## 📂 Project Structure

```text
Carevia/
├── assets/                     # Expo static assets (splash, adaptives)
├── src/
│   ├── assets/                 # App-specific local assets
│   │   ├── fonts/              # Custom fonts (Judson family)
│   │   ├── icons/              # SVG & PNG icon assets organized by category
│   │   └── images/             # Static images (logos, illustrations)
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Generic blocks (buttons, input fields)
│   │   ├── header/             # Header variations
│   │   └── navigation/         # Navbars, Sidebars, Drawers
│   ├── screens/                # Full-page screen components
│   │   ├── Login/              # Authentication screens
│   │   ├── SignUp/
│   │   ├── Home/
│   │   ├── Splash/             # Initial branding screen
│   │   └── ... (Contact, AI-Bot, Family, etc.)
│   └── (store/hooks/utils)     # Logic and utility layers (forthcoming)
├── App.tsx                     # Main entry point (Development testing focus)
├── app.json                    # Expo configuration
└── package.json                # Dependencies and scripts
```

## 🎨 Global Design Tokens

### 🔡 Typography
The **Judson** font family is the primary typeface used throughout the project. It is loaded in `App.tsx` and should be applied to all text components.
- `Judson-Regular`: Main body text, input fields.
- `Judson-Bold`: Headings, labels, buttons.

### 🌈 Colors
- **Primary Gradient**: `#0062FF` (Top) → `#5C8EDF` (Bottom).
- **Secondary Surfaces**: `#D9E8FF` (Light Blue blocks).
- **Text**: `#FFFFFF` on gradients, `#000000` on white surfaces.
- **Glassmorphism**: White/Gray with 30-60% opacity for overlays.

## 🖼️ Icons
Icons are organized in `src/assets/icons/` by feature. Always check the relative path before importing:
- **Common**: `src/assets/icons/common/` (Menu, Profile, Cross, Back).
- **Auth**: `src/assets/icons/login-signup/` (Google PNG).
- **Navigation**: `src/assets/icons/bottom-navbar/` (SVG & PNG icons).

## 🤖 Instructions for AI Development

When first opening this project, follow these guidelines to maintain consistency:

1.  **Development Workflow**: 
    - The project uses a "Component-First" development approach. 
    - `App.tsx` is frequently cleared to test individual components or screens in isolation. 
2.  **Styling Standards**:
    - Use `StyleSheet.create` for all styles.
    - Prefer responsive dimensions using `Dimensions.get('window')` for widths.
    - Elements inside blue containers often require high `zIndex` or `elevation` to be visible correctly on Android.
3.  **UI Consistency**:
    - Input Fields: Width `380`, Height `55`, Radius `20`, Opacity `0.6`.
    - Main Buttons: Oval shape (`radius: 100`), White color, Black text.
    - Drawer/Header Curves: Large radii (typically `60`).
4.  **Dependencies**:
    - Project uses `expo-linear-gradient` for all primary backgrounds.
    - Project uses `react-native-svg` for most icons (except specific PNG assets).
    - `react-native-reanimated` is installed but standard `Animated` API is sometimes preferred for simple, high-compatibility transitions.

## 🚀 Getting Started

1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Start Expo: `npx expo start`.
4.  Clear cache if UI artifacts appear: `npx expo start -c`.
