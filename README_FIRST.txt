# UniGo Driver — REAL APK (Capacitor) Add-on Pack

This pack contains ORIGINAL files you can add to your UniGo project to move from "web inside APK" to a real driver APK foundation.

## What this pack gives you
1) Push notifications (FCM) wiring (client stubs + server endpoint stub)
2) Background/foreground-safe location heartbeat loop (client)
3) Presence payload upgrade (service_type/device/app_version)
4) Android project bootstrap checklist (commands + required permissions)

## How to apply
- Copy folders from this zip into your UniGo repo root (merge, do not delete existing files).
- Then follow docs/MOBILE_APK_SETUP.md.

IMPORTANT:
- You still must run `npx cap add android` to generate the native Android folder.
- Replace placeholders like YOUR_PROJECT_ID, YOUR_SENDER_ID, etc.