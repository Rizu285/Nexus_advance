# Nexus Milestone 1: Setup and Familiarization

## Local Run Steps

1. Install Node.js LTS and npm.
2. Install dependencies:
   - `npm install`
3. Run local dev server:
   - `npm run dev`
4. Open the Vite URL shown in terminal (default: `http://localhost:5173`).

## Architecture Overview

Nexus is a client-side React + TypeScript + Vite application with Tailwind CSS.

### App Composition

- `src/main.tsx`: Application bootstrap and root rendering.
- `src/App.tsx`: Router graph, page registration, and global providers.
- `src/context/AuthContext.tsx`: Authentication/session mock state.
- `src/context/SchedulingContext.tsx`: Meeting availability, request workflow, confirmed meetings state.

### Routing Layers

- Public routes: login/register and auth recovery pages.
- Protected routes: dashboard and feature routes wrapped with `DashboardLayout`.
- `DashboardLayout` composes `Navbar`, `Sidebar`, and route content via `Outlet`.

### Feature Modules

- `src/pages/dashboard/*`: Role-specific dashboard experiences.
- `src/pages/meetings/MeetingsPage.tsx`: Calendar scheduling flow.
- `src/pages/chat/*`, `src/pages/messages/*`: Messaging features.
- `src/pages/investors/*`, `src/pages/entrepreneurs/*`: Discovery and matching.

### Shared UI System

- `src/components/ui/*`: Reusable atoms (`Button`, `Card`, `Badge`, `Input`, `Avatar`).
- `src/components/layout/*`: Navigation shell and app framing.
- `src/index.css`: Global base style tokens and calendar skin.
- `tailwind.config.js`: Theme palette, typography, animations.

## UI Theme Standardization

Theme system now uses consistent foundations across pages:

- Colors:
  - Primary: blue scale (`primary.*`) for primary actions and active states.
  - Secondary: teal scale (`secondary.*`) for contextual highlights.
  - Accent: amber scale (`accent.*`) for emphasis and attention cues.
  - Semantic: `success`, `warning`, `error` tokens.
- Typography:
  - Body font: `Manrope` (`font-sans`).
  - Heading/display: `Sora` (`font-display`).
- Layout:
  - Responsive grid patterns via Tailwind utility classes (`grid-cols-1`, `md`, `lg` breakpoints).
  - Card-first sections to keep spacing and hierarchy consistent.

## Milestone 2 Readiness

Scheduling architecture now supports:

- Add/modify/remove availability slots.
- Send/accept/decline meeting requests.
- Automatic confirmed meeting creation on request acceptance.
- Dashboard meeting counters driven by confirmed meeting data.
