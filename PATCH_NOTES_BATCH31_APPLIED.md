# Batch 31 Applied

Bu batchda `external_payment_assets_bundle.zip` ichidan to‘liq olinadigan payment assetlar tanlab olindi va loyiha naming uslubiga moslab qayta nomlandi.

## Qo‘shilgan yo‘nalishlar
- payment cards: default, visa/mastercard/mir/unionpay/google-pay alt, jcb
- payment states: success/error/warning alt
- payment bonus visuals: loyalty card, bonuses, wallet default, bonus badge
- payment actions: scan, qr delegation
- payment lottie: challenge footer, bank select
- UI principle integration: wallet card list, bonus block, promo selection card, auth/register visual cue, AI challenge footer

## Kengaytirilgan fayllar
- src/assets/payment/index.js
- src/assets/lottie/index.js
- src/assets/assetPolish.js
- src/modules/client/features/client/pages/ClientWallet.jsx
- src/modules/client/features/auto-market/components/Payments/PromoModal.jsx
- src/modules/client/features/auth/pages/Auth.jsx
- src/modules/client/features/auth/pages/Register.jsx
- src/modules/client/features/auto-market/components/modules/CreateAd/AiPipelineStatus.jsx
