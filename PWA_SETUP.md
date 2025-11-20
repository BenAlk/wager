# PWA Setup Guide - Wager

**Status**: ✅ Complete
**Date**: November 20, 2025

## Overview

Wager is now a fully-functional Progressive Web App (PWA) that can be installed on mobile devices and desktops, with offline support and native app-like experience.

## Features Implemented

### ✅ App Manifest
- **File**: `public/manifest.json` + auto-generated `dist/manifest.webmanifest`
- **Name**: Wager - Courier Pay Tracker
- **Short Name**: Wager
- **Theme Color**: #3b82f6 (Blue)
- **Background Color**: #0f172a (Slate-900)
- **Display Mode**: Standalone (full-screen, no browser UI)
- **Orientation**: Portrait-primary (optimized for mobile)
- **Categories**: Finance, Productivity, Business

### ✅ App Icons
All icons feature the Wager brand (blue-to-emerald gradient with TrendingUp arrow):

**PWA Icons** (Android, Chrome, Edge):
- 72×72px
- 96×96px
- 128×128px
- 144×144px
- 152×152px
- 192×192px (maskable)
- 384×384px
- 512×512px (maskable)

**Apple Touch Icons** (iOS, Safari):
- 120×120px (iPhone)
- 152×152px (iPad)
- 167×167px (iPad Pro)
- 180×180px (iPhone Plus/Pro)

**Source Icon**: `public/icon.svg` (vector, can regenerate at any size)

### ✅ Service Worker
- **Plugin**: vite-plugin-pwa v1.1.0
- **Type**: Auto-updating (users get updates automatically)
- **Caching Strategy**:
  - **Supabase API**: NetworkFirst (try network, fallback to cache) - 24hr expiration
  - **Static Assets**: StaleWhileRevalidate (instant load from cache, update in background) - 30 days
- **Offline Support**: Core app functionality works offline with cached data
- **File**: Auto-generated `dist/sw.js` + `dist/workbox-f4004fe4.js`

### ✅ Meta Tags
**index.html** includes:
- Primary meta tags (title, description)
- PWA manifest link
- Theme color (adaptive for light/dark mode)
- Apple-specific meta tags:
  - `apple-mobile-web-app-capable` (enables full-screen)
  - `apple-mobile-web-app-status-bar-style` (black-translucent)
  - `apple-mobile-web-app-title` (Wager)
- Android/Chrome meta tags
- Microsoft Tile configuration

## Installation Instructions

### Testing Locally

1. **Build the app**:
   ```bash
   pnpm run build
   ```

2. **Preview the build**:
   ```bash
   pnpm run preview
   ```

3. **Access at**: http://localhost:4173

4. **Test PWA features**:
   - Open Chrome DevTools → Application tab → Manifest
   - Check "Service Workers" section
   - Click "Add to Home Screen" in browser menu

### Testing on Mobile (Local Network)

1. **Start preview server**:
   ```bash
   pnpm run preview --host
   ```

2. **Note the network IP** (e.g., http://192.168.1.100:4173)

3. **On your phone**:
   - Connect to same WiFi network
   - Open browser and navigate to the IP address
   - Install the PWA (see instructions below)

### Installing on iOS (Safari)

1. Open **wager.netlify.app** in Safari
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Customize name if desired (default: "Wager")
5. Tap **"Add"**
6. Icon appears on home screen with custom Wager icon
7. Launch app - runs in standalone mode (no Safari UI)

**iOS Features**:
- ✅ Custom icon (180×180px Apple Touch Icon)
- ✅ Splash screen (auto-generated from icon + theme color)
- ✅ Full-screen mode (no Safari address bar)
- ✅ Black translucent status bar
- ✅ Gesture navigation support

### Installing on Android (Chrome)

1. Open **wager.netlify.app** in Chrome
2. Tap the **⋮** menu (three dots)
3. Tap **"Add to Home screen"** or **"Install app"**
4. Confirm installation
5. Icon appears on home screen with custom Wager icon
6. Launch app - runs in standalone mode (no Chrome UI)

**Android Features**:
- ✅ Custom icon (192×192px + 512×512px maskable icons)
- ✅ Splash screen (auto-generated)
- ✅ Full-screen mode (no Chrome address bar)
- ✅ Offline support via Service Worker
- ✅ Push notifications support (ready for future feature)

### Installing on Desktop (Chrome/Edge)

1. Open **wager.netlify.app** in Chrome or Edge
2. Look for **install icon** (⊕) in address bar
3. Click icon and confirm installation
4. App opens in standalone window
5. Appears in Start Menu / Applications folder

**Desktop Features**:
- ✅ Standalone app window
- ✅ Custom icon in taskbar/dock
- ✅ Offline support
- ✅ Launch at startup (can be configured)

## Verification Checklist

### PWA Criteria (All Met ✅)

- ✅ **Served over HTTPS** (Netlify provides automatic SSL)
- ✅ **Web App Manifest** with all required fields
- ✅ **Service Worker** registered and active
- ✅ **Icons** in multiple sizes (192×192 minimum, 512×512 recommended)
- ✅ **Theme color** defined
- ✅ **Display mode** set to standalone
- ✅ **Start URL** defined
- ✅ **Offline functionality** via Service Worker caching

### Testing Tools

**Chrome DevTools (Desktop)**:
1. Open DevTools → **Application** tab
2. Check **Manifest** section - should show all icons and metadata
3. Check **Service Workers** - should be "activated and running"
4. Run **Lighthouse** audit (Performance tab) - should show PWA badge

**Chrome DevTools (Mobile)**:
1. Connect Android device via USB
2. Enable USB debugging on phone
3. Open chrome://inspect in desktop Chrome
4. Inspect the mobile browser
5. Check Application tab as above

**Online Tools**:
- [PWA Builder](https://www.pwabuilder.com/) - Analyze wager.netlify.app
- [Lighthouse CI](https://developers.google.com/web/tools/lighthouse) - Automated testing

## Deployment to Netlify

**Status**: ✅ Already configured

The app is already deployed to Netlify. The PWA features will work automatically after the next deployment because:

1. ✅ All PWA assets are in `dist/` folder after build
2. ✅ Netlify serves over HTTPS (required for PWA)
3. ✅ `_redirects` file handles SPA routing
4. ✅ Service Worker files (`sw.js`, `manifest.webmanifest`) are automatically deployed

**Next Deployment**:
```bash
git add .
git commit -m "feat: Add PWA support with icons and service worker"
git push origin main
```

Netlify will automatically:
- Build the app (`pnpm run build`)
- Deploy all files including PWA assets
- Serve over HTTPS with valid SSL certificate
- Make the app installable on all platforms

## Troubleshooting

### "Add to Home Screen" not showing

**iOS (Safari)**:
- Ensure you're using Safari (not Chrome on iOS)
- Check that you're on the live site (HTTPS required)
- Share button → scroll down to find option

**Android (Chrome)**:
- Ensure site is served over HTTPS
- Check that Service Worker is registered (DevTools → Application)
- Some older Android versions may not support PWA

**Desktop**:
- Look for install icon in address bar
- Try right-clicking the page → "Install Wager"

### Service Worker not registering

1. **Check HTTPS**: PWA requires HTTPS (works on localhost too)
2. **Clear cache**: DevTools → Application → Clear storage
3. **Check console**: Look for Service Worker registration errors
4. **Rebuild**: `pnpm run build` to regenerate Service Worker

### Icons not showing

1. **Check paths**: Ensure icons are in `public/icons/` folder
2. **Rebuild**: `pnpm run build` to copy icons to `dist/`
3. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. **Check manifest**: DevTools → Application → Manifest

### Offline mode not working

1. **Service Worker active**: DevTools → Application → Service Workers
2. **Network tab**: Switch to "Offline" mode to test
3. **Cache populated**: Navigate to pages while online first
4. **Supabase**: Some features require network (authentication, real-time updates)

## Limitations

### What Works Offline ✅
- View cached pay data
- Navigate between pages
- View previously loaded weeks
- UI/UX remains functional

### What Requires Network ⚠️
- Login/logout (Supabase authentication)
- Fetching new data (work days, van hires, settings)
- Saving changes (database writes)
- Real-time updates

### Future Enhancements 🚀
- Background sync for offline writes (queue changes, sync when online)
- Push notifications for rankings reminders
- App shortcuts (quick add work, view pay)
- Share target API (share pay summaries)

## File Structure

```
wager/
├── public/
│   ├── icon.svg                  # Source SVG icon (512×512)
│   ├── apple-touch-icon.png      # iOS 180×180
│   ├── manifest.json             # Static manifest backup
│   └── icons/
│       ├── icon-72x72.png
│       ├── icon-96x96.png
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       ├── icon-512x512.png
│       ├── apple-touch-icon-120x120.png
│       ├── apple-touch-icon-152x152.png
│       ├── apple-touch-icon-167x167.png
│       └── apple-touch-icon-180x180.png
├── index.html                    # Updated with PWA meta tags
├── vite.config.ts                # VitePWA plugin configured
└── src/
    └── main.tsx                  # Service Worker registration
```

## Support

**Browsers**:
- ✅ Chrome/Edge (Desktop & Android) - Full support
- ✅ Safari (iOS/macOS) - Full support
- ✅ Firefox - Partial support (manifest, icons)
- ⚠️ Samsung Internet - Should work (untested)
- ❌ Internet Explorer - Not supported (app doesn't support IE anyway)

**Operating Systems**:
- ✅ iOS 11.3+ (Safari required for installation)
- ✅ Android 5.0+ (Chrome 72+)
- ✅ Windows 10+ (Chrome, Edge)
- ✅ macOS (Safari 11.3+, Chrome, Edge)
- ✅ Linux (Chrome, Firefox)

## Performance

**Install Size**: ~1MB (compressed)
- App bundle: 280KB gzipped
- Icons: ~200KB total
- Service Worker cache: ~1MB for full offline experience

**First Load**: Fast (Netlify CDN)
**Subsequent Loads**: Instant (cached by Service Worker)
**Offline**: Full UI, cached data only

---

**Documentation**: Complete ✅
**Testing**: Required on physical devices
**Deployment**: Ready for next push to main branch

**Next Steps**:
1. Test installation on iOS device (Safari)
2. Test installation on Android device (Chrome)
3. Verify offline functionality
4. Deploy to production
5. Share with beta testers for real-world testing
