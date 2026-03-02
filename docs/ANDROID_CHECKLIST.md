# Android (Real APK) checklist

## Capacitor
npx cap add android
npm run build
npx cap sync android

## Permissions
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION
- ACCESS_BACKGROUND_LOCATION (driver online mode)
- FOREGROUND_SERVICE
- POST_NOTIFICATIONS (Android 13+)

## Push (Firebase)
- Create Firebase project
- Add Android app (package must match capacitor config)
- Put google-services.json at android/app/google-services.json

## Background location reality check
True background location is hard:
- Start with foreground loop + push "wake" events
- Then add a dedicated foreground service plugin if needed