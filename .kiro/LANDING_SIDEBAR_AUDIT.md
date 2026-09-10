# Landing Page Mobile Sidebar Z-Index & Accessibility Audit

## File Location
`components/layout/site-header.tsx` - Contains the main navigation header with mobile drawer

## Current Z-Index Stack Analysis

### Header Element
```tsx
<header className="sticky top-0 z-50 border-b ...">
```
✅ **Correct**: `z-50` is appropriate for sticky header

### Mobile Drawer (Backdrop)
```tsx
<motion.div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm lg:hidden">
```
✅ **Correct**: `z-50` for backdrop overlay

### Mobile Drawer (Content)
```tsx
<motion.div className="absolute right-0 top-0 h-full w-[320px] bg-white ... z-50">
```
⚠️ **Issue**: The drawer content has `absolute` positioning but is inside the `fixed` backdrop container with `z-50`. The relative z-index inside the fixed container should be higher.

## Issues Identified

### 1. **Drawer Content Positioning Issue**
**Current Code** (Lines ~180-200):
```tsx
<motion.div
  className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm lg:hidden"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={() => setDrawerOpen(false)}
>
  <motion.div
    className="absolute right-0 top-0 h-full w-[320px] bg-white px-6 py-6 shadow-soft overflow-y-auto"
    initial={{ x: 320 }}
    animate={{ x: 0 }}
    exit={{ x: 320 }}
    transition={{ type: "spring", damping: 25, stiffness: 320 }}
    onClick={(e) => e.stopPropagation()}
  >
```

**Problem**: 
- The outer `motion.div` has `z-50` with `absolute` positioning, creating a new stacking context
- The inner drawer content uses `absolute` which makes it relative to the outer fixed container
- This can cause visual stacking issues on some browsers/devices

### 2. **Missing Accessibility Attributes**
- No `role="dialog"` on the drawer
- No `aria-modal="true"`
- No `aria-labelledby` linking to drawer title
- No `aria-hidden="true"` on backdrop

### 3. **Missing Keyboard Navigation**
- Escape key doesn't close the drawer
- Tab focus isn't trapped within the drawer
- Screen readers can still navigate to hidden content

### 4. **Focus Management**
- No focus is set to the drawer when opened
- No focus is restored when drawer closes
- Menu button still visible and focusable while drawer is open

## Recommendations

### Fix 1: Correct Z-Index Layering (Immediate)

**Location**: Lines ~175-200 in `site-header.tsx`

```tsx
{drawerOpen ? (
  <motion.div
    className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setDrawerOpen(false)}
    aria-hidden="true"
  >
    <motion.div
      className="fixed right-0 top-0 h-full w-[320px] bg-white px-6 py-6 shadow-soft overflow-y-auto z-50"
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ type: "spring", damping: 25, stiffness: 320 }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
    >
```

**Changes**:
- Changed backdrop from `z-50` to `z-40`
- Changed drawer from `absolute` to `fixed` 
- Added explicit `z-50` to drawer content
- Added `aria-hidden="true"` to backdrop
- Added `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to drawer

### Fix 2: Add Drawer Title ID

**Location**: Lines ~185-189 in `site-header.tsx`

```tsx
<div className="flex items-center justify-between pb-6">
  <Link 
    href="/" 
    id="mobile-menu-title"  // ← Add this
    onClick={() => setDrawerOpen(false)} 
    className="flex items-center gap-3 text-lg font-semibold text-slate-950"
  >
```

### Fix 3: Add Keyboard Navigation

Add a `useEffect` hook to handle Escape key and focus management:

```tsx
// Add after the useEffect that handles auth
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && drawerOpen) {
      setDrawerOpen(false);
    }
  };

  if (drawerOpen) {
    // Prevent body scroll when drawer is open
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }
}, [drawerOpen]);
```

### Fix 4: Add Focus Trap (Optional but Recommended)

For better accessibility, trap focus within the drawer when open:

```tsx
useEffect(() => {
  if (drawerOpen) {
    // Find all focusable elements in the drawer
    const focusableElements = document.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    firstElement?.focus();
  }
}, [drawerOpen]);
```

## Mobile Responsiveness Checklist

- [ ] Drawer opens without overlapping hero section
- [ ] Backdrop opacity (30%) allows seeing content behind
- [ ] Drawer width (320px) is appropriate for mobile (< 768px)
- [ ] Close button (X) is easily tappable (min 44x44px)
- [ ] Links have sufficient padding for touch targets (44x44px minimum)
- [ ] Drawer slides smoothly from right side
- [ ] Clicking backdrop closes drawer
- [ ] Pressing Escape closes drawer
- [ ] Body scroll is locked when drawer is open
- [ ] Screen reader announces drawer as dialog

## Visual Test on Small Devices

**Test points**:
1. **iPhone SE (375px)**: Drawer should not overlap content, smooth animation
2. **iPhone 12 (390px)**: Drawer width should not be too wide
3. **Android tablet (480px)**: Drawer content should be readable and tappable
4. **iPad Mini (768px)**: Drawer hidden, full nav shown

## Performance Considerations

✅ Using `motion` (Framer Motion) for smooth animations
✅ No performance impact from z-index adjustments
✅ Backdrop blur is GPU-accelerated
✅ Body overflow lock is minimal performance cost

## Screen Reader Testing

Need to verify with:
- NVDA (Windows)
- JAWS (Windows)  
- VoiceOver (macOS/iOS)
- TalkBack (Android)

Screen reader should announce:
- "Navigation menu, dialog"
- All links and buttons in logical order
- Close button functionality
- Current selected nav item
