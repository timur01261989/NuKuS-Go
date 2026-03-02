# MOBILE_APK_SETUP (Driver-first)

## 0) Preconditions
- Node 18+
- Java 17 (recommended for Android)
- Android SDK installed (or use cloud build)

If your PC is weak: use cloud build (GitHub Actions / Codemagic). You can still develop UI locally.

## 1) Install Capacitor + plugins
From UniGo/:
npm i @capacitor/android @capacitor/app @capacitor/device @capacitor/network
npm i @capacitor/push-notifications
# For background location you have choices:
# - Use a dedicated plugin like capacitor-background-geolocation (paid/complex) OR
# - Use a simple foreground loop while app is active + push for "wake up" events
# Start simple: active loop + push; add true background later.

npx cap init "UniGo Driver" com.unigo.driver --web-dir=dist

## 2) Add Android platform
npx cap add android
npm run build
npx cap sync android

## 3) Android permissions (required)
In android/app/src/main/AndroidManifest.xml ensure:
- android.permission.INTERNET
- android.permission.ACCESS_FINE_LOCATION
- android.permission.ACCESS_COARSE_LOCATION
- android.permission.ACCESS_BACKGROUND_LOCATION (Driver Online mode)
- android.permission.FOREGROUND_SERVICE
- android.permission.POST_NOTIFICATIONS (Android 13+)

## 4) Firebase (FCM)
- Create Firebase project
- Add Android app with package: com.unigo.driver
- Download google-services.json into:
  android/app/google-services.json

Then in android build.gradle enable Google services plugin.

## 5) Configure env (server)
Set on Vercel / server env:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- FCM_SERVER_KEY  (or better: service account JSON)

## 6) Client wiring (Driver app)
Use:
- src/native/push.js
- src/native/driverHeartbeat.js

Call driverHeartbeat.start(...) when driver toggles "Online".
Stop it when driver toggles "Offline".

## 7) Do NOT skip this
Presence must be TTL-based (last_seen_at) on server.
Never rely on a boolean "online" written from 2 different places.