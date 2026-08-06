# AmaSports Mobile

React Native + Expo (TypeScript) client for the AmaSports performance platform, built for coaches and students. This repo is the frontend only — it talks to [`sports-app-backend`](../AmaSportsBackend) exclusively over REST.

## Tech stack

- **Framework:** React Native + Expo (SDK 57), TypeScript (strict mode)
- **Routing:** Expo Router (file-based, typed routes)
- **State management:** Zustand
- **API client:** Axios, with a centralized instance + interceptors
- **Secure storage:** expo-secure-store (Keychain / Keystore backed)

## Folder structure

```
app/                        Expo Router routes (file-based navigation)
  index.tsx                  Splash / bootstrap screen — decides where to redirect
  onboarding.tsx              3-slide onboarding carousel
  (auth)/                     Public auth stack
    _layout.tsx
    login.tsx
    register.tsx
    forgot-password.tsx
    reset-password.tsx
  (protected)/                 Authenticated app (route-guarded)
    _layout.tsx                 Redirects to /login if not authenticated
    (tabs)/
      _layout.tsx
      home.tsx
      profile.tsx                Includes logout

src/
  components/
    ui/                       Reusable primitives (Button, TextField, ScreenContainer, ...)
    onboarding/               Onboarding-specific components
  constants/                  Config + static content (onboarding copy, storage keys)
  services/                   apiClient (Axios), authService, secureStorage
  store/                      Zustand stores (authStore, onboardingStore)
  theme/                      Design tokens: colors, spacing, typography
  types/                      Shared TypeScript types (API envelope, auth models)
  utils/                      Form validation helpers
```

This structure is intentionally flat and modular: new domains (teams, performance analytics, live scores, live streaming, notifications) each get their own folder under `app/(protected)/` plus a matching `src/services/*Service.ts` and, if needed, a `src/store/*Store.ts` — without touching auth or navigation plumbing.

## Getting started

```bash
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_URL to point at your backend
npm run start
```

Then press `a` (Android), `i` (iOS), or `w` (web) — or scan the QR code with Expo Go.

### Pointing at the backend

Edit `.env`:

```
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

- **iOS simulator:** `http://127.0.0.1:8000/api` works as-is.
- **Android emulator:** use `http://10.0.2.2:8000/api` (emulator alias for host loopback).
- **Physical device:** use your machine's LAN IP, e.g. `http://192.168.1.10:8000/api`, and make sure the Laravel backend is served with `--host 0.0.0.0`.

## Authentication flow

1. **Splash** (`app/index.tsx`) waits for Zustand stores to hydrate from secure storage, then redirects to onboarding, login, or the authenticated home tab.
2. **Onboarding** (`app/onboarding.tsx`) — 3 swipeable slides, shown once (persisted via `onboardingStore`).
3. **Login / Register / Forgot Password / Reset Password** — all under `app/(auth)/`. Registration logs the user straight in — there is no email/OTP verification step.
4. On successful login/registration, the API token + user are persisted via `expo-secure-store` and the app redirects into `app/(protected)/`.
5. **Route protection:** `app/(protected)/_layout.tsx` redirects to `/login` whenever `authStore.isAuthenticated` is false — this is the single guard every future authenticated screen inherits automatically.
6. **Logout** (Profile tab) clears both server-side (Sanctum token revoke) and local session state.
7. A `401` response from any API call automatically force-logs-out the user (see `apiClient.ts`'s `setUnauthorizedHandler`).

Forgot/reset password still uses a 6-digit emailed code (`OtpService` on the backend) — that flow is unaffected.

## API error handling

Every Axios response is normalized into an `ApiError` (see `src/types/api.ts`) exposing `.message`, `.status`, `.errors` (Laravel validation errors keyed by field), and `.firstFieldError`. Screens never touch raw Axios/network errors directly.

## Design tokens

Brand colors live in `src/theme/colors.ts` — do not hardcode hex values elsewhere:

| Token      | Hex       |
|------------|-----------|
| Primary    | `#155EEF` |
| Navy       | `#0B1F3A` |
| Success    | `#22C55E` |
| Live/Alert | `#EF4444` |
| Background | `#FFFFFF` |
| Cards      | `#F8FAFC` |
| Text       | `#0F172A` |

## Scripts

| Command | Description |
|---|---|
| `npm run start` | Start Metro bundler |
| `npm run android` / `ios` / `web` | Start on a specific platform |
| `npm run typecheck` | TypeScript check, no emit |
| `npm run lint` | ESLint |
