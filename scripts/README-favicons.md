# Favicon Generation Guide

## Overview

This project uses the Instagram gradient icon as the favicon across all platforms and devices.

## Generated Files

All favicons are located in `/public/` directory:

| File | Size | Purpose |
|------|------|---------|
| `favicon.ico` | 32x32 | Legacy browsers, browser tabs |
| `favicon-16x16.png` | 16x16 | Modern browsers (small) |
| `favicon-32x32.png` | 32x32 | Modern browsers (standard) |
| `apple-touch-icon.png` | 180x180 | iOS home screen, Safari |
| `android-chrome-192x192.png` | 192x192 | Android home screen |
| `android-chrome-512x512.png` | 512x512 | Android splash screen |

## How to Regenerate

If you need to update the favicon (e.g., new logo design):

1. Replace `Instagram_icon_Gradient.png` in the project root
2. Run the generation script:

```bash
node scripts/generate-favicons.js
```

3. The script will automatically:
   - Generate all required sizes
   - Optimize images with Sharp
   - Place files in `/public/` directory

## Web Manifest

The `site.webmanifest` file enables PWA features:

- **Add to Home Screen** on mobile devices
- **Standalone mode** (app-like experience)
- **Theme color** (#0095f6 - Instagram blue)
- **Orientation** locked to portrait for mobile

## Metadata Configuration

Favicon metadata is configured in `app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  manifest: "/site.webmanifest",
  icons: {
    icon: [...],      // Browser favicons
    apple: [...],     // iOS icons
    other: [...]      // Android icons
  },
  appleWebApp: {
    capable: true,
    title: "InstaClone"
  }
};
```

## Testing

### Browser Tab Icon
1. Open `http://localhost:3000`
2. Check the browser tab for the Instagram gradient icon

### iOS (Safari)
1. Open site on iPhone/iPad
2. Tap Share → Add to Home Screen
3. Icon should show Instagram gradient

### Android (Chrome)
1. Open site on Android device
2. Tap menu → Add to Home Screen
3. Icon should show Instagram gradient

### Favicon Cache
If you don't see the new favicon:
1. Clear browser cache
2. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Close and reopen browser

## Technical Details

### Image Processing
- **Tool:** Sharp (high-performance image processing)
- **Format:** PNG with transparency
- **Optimization:** Automatic compression
- **Fit:** Contain (maintains aspect ratio)

### Browser Support
- ✅ Chrome/Edge (all platforms)
- ✅ Firefox (all platforms)
- ✅ Safari (macOS, iOS)
- ✅ Opera
- ✅ Samsung Internet
- ✅ Legacy IE (via favicon.ico)

### PWA Features
When installed as PWA:
- Standalone window (no browser chrome)
- Custom splash screen (Android)
- Theme color in status bar
- App-like experience

## Troubleshooting

### Favicon not showing
- Clear browser cache
- Check `/public/favicon.ico` exists
- Verify metadata in `app/layout.tsx`

### Wrong icon on mobile
- Check `site.webmanifest` is accessible
- Verify icon paths are correct
- Test in incognito/private mode

### Blurry icons
- Regenerate with higher quality source image
- Ensure source image is at least 512x512px
- Check Sharp processing settings

## Future Improvements

- [ ] Add favicon for dark mode
- [ ] Generate SVG favicon for vector scaling
- [ ] Add maskable icon variants for Android
- [ ] Implement dynamic favicon (e.g., notification badges)

---

**Last Updated:** December 2025  
**Script Location:** `scripts/generate-favicons.js`  
**Source Image:** `Instagram_icon_Gradient.png`

