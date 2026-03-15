# UNIGO UI Rework Notes

## Nimalar yangilandi
- Yangi global mobile UI kit qo‘shildi: `src/modules/shared/ui/UnigoMobileUI.jsx`
- Yangi design-system CSS qo‘shildi: `src/modules/shared/ui/unigo-mobile.css`
- Brand tokenlar yangilandi: `src/theme/tokens.css`
- Client asosiy sahifalar qayta yozildi:
  - Home
  - Orders
  - Wallet
  - Profile
  - Profile Details
  - Referral
  - Promo
  - Settings
- Driver asosiy sahifalar qayta yozildi:
  - DriverHome
  - DriverOrders
  - DriverWallet
  - DriverProfile
  - DriverSettings
  - DriverVehicles
  - DriverInsights
  - DriverReferral
- Client routerga yangi sahifalar qo‘shildi:
  - `/orders`
  - `/profile/details`

## Muhim eslatma
Bu reworkda asosiy navigatsion va account/dashboard qatlamlari yagona stylega o‘tkazildi.
Servislarning chuqur ichki sahifalari (masalan murakkab xarita va legacy oqimlar) ishlash prinsipi buzilmasligi uchun to‘liq almashtirilmadi.
