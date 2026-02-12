# Mahjong Score Tracker - Expo

A mobile-first Mahjong score tracking application built with Expo and React Native, ported from the Next.js Mahjong repository.

## Features

- 4-player Mahjong game management
- Score tracking with multiple action types (Win, Zimo, Zha Hu)
- LA (consecutive wins) bonus tracking
- Dealer rotation system
- Analytics dashboard with charts
- Game history and state persistence
- Player management (rename, reorder seats)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Project Structure

```
.
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Main game screen
├── src/
│   ├── components/        # Reusable UI components
│   ├── lib/               # Utility functions and helpers
│   │   ├── storage.ts     # AsyncStorage wrapper
│   │   └── utils.ts       # General utilities
│   ├── hooks/             # Custom React hooks
│   └── types.ts           # TypeScript type definitions
├── assets/                # Images and static assets
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Technologies Used

- **Expo**: Development platform
- **React Native**: Mobile framework
- **TypeScript**: Type safety
- **React Navigation**: Navigation (via Expo Router)
- **AsyncStorage**: Local data persistence
- **React Native Paper**: UI component library
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **date-fns**: Date utilities

## Ported from Next.js

This application is a port of the Mahjong Next.js application (Funnywai/Mahjong) to React Native using Expo. Key changes include:

- Replaced localStorage with AsyncStorage
- Replaced Radix UI components with React Native Paper
- Converted Next.js routing to Expo Router
- Adapted web-based charts to React Native compatible solutions
- Updated styling from Tailwind CSS to React Native StyleSheet

## License

Private
