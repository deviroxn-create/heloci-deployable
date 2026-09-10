# Sidebar Z-Index & Small Screen Visibility Audit

## Issue Identified

The mobile sidebar in `eligibility-assistant-v2.tsx` has z-index layering issues on small screens where it appears under the hero section and other components.

### Current Z-Index Stack

```
Mobile Drawer Container (z-40)
├── Backdrop overlay (z-30)
├── Fixed bottom drawer (z-40)
└── Sticky progress bar (z-30)  ← PROBLEM
    └── Hero/Question cards
```

## Root Causes

### 1. **Sticky Progress Bar Conflict**
- **Location**: Line 476 in `eligibility-assistant-v2.tsx`
- **Current**: `sticky top-0 z-30`
- **Issue**: The sticky progress bar at `z-30` sits between the backdrop (`z-30`) and drawer (`z-40`), creating confusion in the stacking context
- **Impact**: On some browsers, the progress bar may visually obscure the drawer or cause layout issues

### 2. **Insufficient Z-Index Hierarchy**
The current z-index values are too close together:
- Backdrop: `z-30`
- Sticky progress: `z-30` (same as backdrop)
- Drawer: `z-40`

This lacks clear separation and can cause rendering issues across browsers.

### 3. **Missing Accessibility Attributes on Drawer**
- No `role="dialog"` on the drawer
- No `aria-modal="true"` 
- No `aria-labelledby` for the sidebar title
- Missing keyboard handling (Escape key doesn't close)

## Recommendations

### Fix 1: Increase Z-Index Values (Immediate)

**File**: `components/eligibility/eligibility-assistant-v2.tsx`

Change the sticky progress bar z-index:
```tsx
// Line ~476
- <div className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-8">
+ <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-8">
```

Update the mobile drawer:
```tsx
// Line ~702
- <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" 
+ <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" 

// Line ~704
- <div className="fixed bottom-0 left-0 right-0 z-40 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl lg:hidden">
+ <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl lg:hidden">
```

**New Z-Index Stack**:
```
z-50: Mobile Drawer Content
z-40: Backdrop Overlay
z-10: Sticky Progress Bar
z-0:  Main Content
```

### Fix 2: Improve Accessibility

Add proper ARIA attributes to the drawer:

```tsx
// Line ~702
<>
  <div 
    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" 
    onClick={() => setSidebarOpen(false)} 
    aria-hidden="true" 
  />
  <div 
    className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl lg:hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="sidebar-title"
  >
    <div className="mb-4 flex items-center justify-between">
      <p id="sidebar-title" className="text-sm font-semibold text-slate-900">
        Your progress
      </p>
      <button 
        type="button" 
        onClick={() => setSidebarOpen(false)} 
        aria-label="Close progress panel"
        className="rounded-full p-1 text-slate-400 hover:text-slate-600"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
    {/* ... rest of content ... */}
  </div>
</>
```

### Fix 3: Add Keyboard Navigation

Add an `useEffect` hook to handle Escape key:

```tsx
// Add after other useState declarations
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  if (sidebarOpen) {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }
}, [sidebarOpen]);
```

## Testing Checklist

- [ ] On mobile (< 768px), sidebar drawer appears on top of all content
- [ ] Clicking backdrop closes the drawer
- [ ] Pressing Escape closes the drawer
- [ ] Progress bar doesn't visually overlap with drawer
- [ ] Screen reader announces drawer as modal
- [ ] Sidebar title is properly associated with the dialog (accessible name)
- [ ] Button label "Close progress panel" is accessible

## Similar Components to Check

Apply the same fixes to:
1. `components/communications/ConversationWorkspace.tsx` - Has mobile sidebar toggle
2. Any other mobile drawer components using z-index

## Performance Notes

- No performance impact from z-index adjustments
- Keyboard handler is properly cleaned up
- Backdrop blur is GPU-accelerated
