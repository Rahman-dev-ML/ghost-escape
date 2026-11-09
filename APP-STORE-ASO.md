# Ghost Escape — App Store Connect paste pack (Horror Survival / 5.0)

## CRITICAL
Current TestFlight IPA is the OLD Capacitor chase game (“ONE TAP TWO WORLDS”).
Do **not** Add for Review with that build + this Horror listing.
Rebuild after swapping `www` to GhostEscape-5.0.0 HTML (or ship the real 5.0 binary). Icon fix is already on `main` (`9c11333`).

---

## Product Page — English (U.S.)

### Name (30)
Ghost Escape: Horror Survival

### Subtitle (30)
Find seals. Hide. Escape.

### Promotional Text (170)
Three seals bind the door. Explore the house, hold your beam, hide when it hunts — and get out before your resolve breaks. Offline horror. No ads.

### Description (paste all)
Three seals bind the door. Something in the house wants you to stay.

Ghost Escape is a first-person survival horror game set inside a haunted house. Explore its rooms, recover three seals and return to the exit before the ghost breaks your resolve. Your flashlight can buy you time. Your hiding place can buy you a breath. Neither will keep you safe forever.

EXPLORE. FIND THE SEALS. REACH THE EXIT.
Move freely through furnished rooms and dark corridors. Follow pale floor lights toward the next seal, watch your compass and keep an eye on your resolve, stamina and light charge. Collect all three seals to unlock the way out.

HOLD YOUR BEAM. HOLD YOUR NERVE.
Aim your flashlight at the ghost and hold BEAM to drive it back. Keep the light on it long enough to banish it briefly. Release to recharge, or find a flask of light when your charge runs low.

HIDE BEFORE IT SEES YOU.
Slip into a wardrobe and watch through the slats as the ghost passes. Your breath is limited, and cover will not save you if it watched you enter. Choose your moment to leave.

LISTEN. IT CAN MOVE.
A sharp inhale warns of a rush. Cold air signals a new manifestation. Learn the different hunting patterns of the Widow, the Listener and the Drifter. The map holds fading echoes of where the ghost was; it cannot tell you where it is now.

THE HOUSE GOES ON.
Each escape leads to another floor, with changing routes, seal locations and increasing pressure. Survive as many floors as you can, return for the Daily Haunt or share a challenge code so a friend can try the same house. Challenge records stay on each device.

UNCOVER WHAT THE HOUSE REMEMBERS.
Find 12 optional journal pages, complete objectives and collect six flashlight finishes. Save an active escape and continue later.

PLAY YOUR WAY.
Play offline with touch movement and drag-to-look controls. Adjust music and sound separately, choose gentler lighting, reduce camera motion or use lower-detail graphics.

Put on headphones. Find the three seals. Listen before you turn the corner.

### Keywords (100 chars max — paste exact)
horror,survival,escape,flashlight,haunted,house,offline,fps,hide,seals,ghost,scary

### Support URL
https://cdn.jsdelivr.net/gh/Rahman-dev-ML/ghost-escape@main/privacy.html

### Marketing URL
(leave blank)

### Version
1.0

### Copyright
2026 Callisto Solutions

### Routing App Coverage File
(none)

---

## Screenshots & Header (folder already open on Desktop)

Folder: `C:\Users\Lenovo\Desktop\GhostEscape-AppStore-Assets`

| ASC slot | Folder / file | Upload order |
|---|---|---|
| iPhone 6.3" (1206×2622) | `iphone-6.3-1206x2622\` | 01 beam → 02 house → 03 seals → 04 hide → 05 hud → 06 map |
| iPhone Duo outer (1398×2034) | `iphone-duo-outer-1398x2034\` | same 01–06 |
| iPhone Duo inner (2007×2853) | `iphone-duo-inner-2007x2853\` | same 01–06 |
| iPad 13" (2064×2752) | `ipad-13-2064x2752\` | same 01–06 |
| Header 5244×2950 | `header-search\header-5244x2950.png` | Header |
| Search 5244×2950 | `header-search\search-5244x2950.png` | Search Results |
| Alt header 3840×1646 | `header-search\header-3840x1646.png` | if ASC asks |
| **App Icon 1024** | `AppIcon-1024.png` | ASC → App Information → App Icon (if separate) |

Screenshots are real Play-pack art (beam / house / seals / hide / HUD / map echo) — not chase-game placeholders.

---

## App Information

### Category
Primary: Games → **Action**  
Secondary: **Adventure**

### Age Ratings (answers)
- Horror/Fear Themes: **Frequent / Intense**
- Cartoon or Fantasy Violence: **Infrequent**
- Guns or Other Weapons: **None** (flashlight only)
- Realistic Violence / Prolonged Graphic: **None**
- Profanity: **None**
- Alcohol / Tobacco / Drugs: **None**
- Medical: **None**
- Sexual Content / Nudity: **None**
- Gambling / Loot Boxes: **None**
- Unrestricted Web Access / UGC / Chat / Ads: **No**
- Parental Controls / Age Assurance: **No**

Expect **12+** (horror).

### Content Rights
Does not contain third-party content you do not have rights to.  
(Or: you own / licensed all art, audio, code.)

### License Agreement
Apple’s Standard License Agreement

### App Privacy
**Data Not Collected**

### Encryption
Info.plist already has `ITSAppUsesNonExemptEncryption` = **false**  
In ASC: “App uses non-exempt encryption” → **No**

### Digital Services Act
Complete trader / DSA contact if ASC requires it for your account region (EU). Use your Callisto / personal contact details.

---

## Build

1. Codemagic rebuild on `main` (icon push `9c11333`) **after** `www` is the real 5.0 horror game — not the chase shell.
2. Add Build → select new build.
3. Game Center → **off** / skip.

---

## App Review Information

### Sign-in required
**No** (offline; no account)

### Contact
- First name: Abdul
- Last name: Rahman
- Phone: +923125078253
- Email: rahmanik1228@gmail.com

### Notes (paste)
Offline first-person horror survival. Goal: find 3 seals on each floor, hide in wardrobes when hunted, hold BEAM (flashlight) on the ghost to repel it, then exit. No login, no IAP, no ads, no internet required. Landscape. Tutorial can be skipped from Controls / Settings. Headphones recommended.

Demo path for review:
1. Tap ENTER THE HOUSE.
2. Move with left pad, look by dragging.
3. Pick up a seal (glowing object). Hold BEAM on red seals if the floor requires unbinding.
4. When the ghost appears, hold BEAM on it or hide in a wardrobe.
5. After 3 seals, go to the exit door.

### Attachment
Optional: none needed.

---

## Version Release
Manually release this version (recommended for first ship).

---

## Icon status
- Brand icon **is** in the repo: `ios/.../AppIcon.appiconset/AppIcon-512@2x.png` (1024×1024 RGB) — pushed `9c11333`.
- Store upload copy: `GhostEscape-AppStore-Assets\AppIcon-1024.png`
- Old TestFlight still shows Capacitor wireframe until you rebuild with this commit + correct game binary.
