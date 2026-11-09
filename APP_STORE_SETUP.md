# Ghost Escape — App Store setup

## IDs
- App name: Ghost Escape
- Bundle ID: `com.ghostescape.game` (same as Android)
- Privacy: https://cdn.jsdelivr.net/gh/Rahman-dev-ML/ghost-escape@main/privacy.html

## Your steps
1. Apple Developer → Identifiers → register Explicit App ID `com.ghostescape.game` (no special capabilities)
2. Profiles → App Store Connect profile for that App ID → download/upload to Codemagic (or Fetch)
3. App Store Connect → New App
   - Platforms: iOS
   - Name: Ghost Escape
   - Bundle ID: com.ghostescape.game
   - SKU: ghostescape-ios
4. Copy numeric Apple ID from App Information → put in `codemagic.yaml` as `APP_STORE_APPLE_ID`
5. Codemagic → add this GitHub repo → start workflow **Ghost Escape iOS (App Store)**
6. Fill listing: screenshots from `store-listing/`, privacy URL above, App Privacy = Data Not Collected

## Build
Codemagic Capacitor path (same as PrepTra / Chroma). No Expo login.