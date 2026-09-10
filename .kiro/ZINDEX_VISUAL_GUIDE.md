# Z-Index Visual Guide - Before & After

## Landing Page Mobile Drawer

### BEFORE (Problematic)
```
┌─────────────────────────────────────────────────────────────┐
│ Header (sticky top-0 z-50)                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Logo    Nav Items    [Menu Button] ✓                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                     ↓ Mobile Menu Clicked
┌─────────────────────────────────────────────────────────────┐
│ Backdrop (z-50) - SAME AS HEADER                           │
│ ┌──────────────────────────────────────────┐              │
│ │ Drawer Content (absolute) - NESTED      │              │
│ │  ╔════════════════════════════════════╗ │              │
│ │  ║ Logo    [X Close]                 ║ │              │
│ │  ║                                    ║ │              │
│ │  ║ Home                               ║ │              │
│ │  ║ Find Housing                       ║ │              │
│ │  ║ Eligibility Checker                ║ │              │
│ │  ║                                    ║ │              │
│ │  ║ Programs                           ║ │              │
│ │  ║  • Family Housing                  ║ │              │
│ │  ║  • Emergency Housing               ║ │              │
│ │  ║  • Veteran Housing                 ║ │              │
│ │  ║                                    ║ │              │
│ │  ║ Resources                          ║ │              │
│ │  ║  • FAQ                             ║ │              │
│ │  ║  • Guides                          ║ │              │
│ │  ║  • Documents                       ║ │              │
│ │  ╚════════════════════════════════════╝ │              │
│ └──────────────────────────────────────────┘              │
│ Hero Section + Content (VISIBLE BEHIND)                   │
└─────────────────────────────────────────────────────────────┘

⚠️ ISSUES:
- Backdrop and Header both z-50 (same layer)
- Drawer is absolute (nested in fixed container)
- Can cause visual stacking confusion
- Not keyboard accessible
- Missing ARIA attributes
```

### AFTER (Fixed)
```
┌─────────────────────────────────────────────────────────────┐
│ Header (sticky top-0 z-50) ← Top layer for sticky header  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Logo    Nav Items    [Menu Button] ✓                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                     ↓ Mobile Menu Clicked
┌─────────────────────────────────────────────────────────────┐
│ Backdrop (z-40) - Clear hierarchy                          │ z-50 ← Drawer Content (fixed)
│ ┌────────────────────────────────────────────────────────┐ │ ┌──────────────────────────┐
│ │ (Semi-transparent overlay - allows see behind)        │ │ │ ╔════════════════════╗  │
│ │                                                        │ │ │ ║ Logo    [X]       ║  │
│ │ Hero Section (visible behind 30% opacity)             │ │ │ ║                  ║  │
│ │ ┌──────────────────────────────────────────────────┐ │ │ │ ║ Home             ║  │
│ │ │ [Beautiful background image/text]               │ │ │ │ ║ Find Housing     ║  │
│ │ │                                                 │ │ │ │ ║ Eligibility      ║  │
│ │ │ "Find a home and the support                   │ │ │ │ ║                  ║  │
│ │ │ to move forward"                               │ │ │ │ ║ Programs         ║  │
│ │ │                                                 │ │ │ │ ║  • Family        ║  │
│ │ │ [Check Eligibility] [Explore Housing]          │ │ │ │ ║  • Emergency     ║  │
│ │ └──────────────────────────────────────────────────┘ │ │ │ ║  • Veteran       ║  │
│ │                                                        │ │ │ ║                  ║  │
│ └────────────────────────────────────────────────────────┘ │ │ ║ Resources        ║  │
│                                                            │ │ ║  • FAQ           ║  │
│                                                            │ │ ║  • Guides        ║  │
│                                                            │ │ ║  • Documents     ║  │
│                                                            │ │ ╚════════════════╝  │
└─────────────────────────────────────────────────────────────┘ └──────────────────────────┘
  z-40 (Backdrop)                                              z-50 (Drawer)

✅ FIXES:
- Clear z-index hierarchy: z-40 < z-50
- Drawer uses fixed positioning (not nested absolute)
- ARIA attributes for accessibility
- Escape key support
- Body scroll locked
- Proper focus management
```

---

## Eligibility Assistant Mobile Sidebar

### BEFORE (Problematic)
```
Page Layout on Mobile (< 768px):

┌────────────────────────────────────┐
│ Sticky Progress Bar (z-30)         │  ← Questions: Hero section shown?
│ ┌──────────────────────────────────┤ │
│ │ Stage 1/3  Question 2/14    ▰▪▪▪▪ │ │
│ └──────────────────────────────────┘ │
│                                       │
│ Main Content Area                     │
│ ┌──────────────────────────────────┐ │
│ │ [Stage Transition Banner]        │ │
│ │                                  │ │
│ │ Caseworker Chat Bubble:          │ │
│ │ "This helps me understand..."    │ │
│ │                                  │ │
│ │ ╔══════════════════════════════╗ │ │
│ │ ║ What is your housing need?  ║ │ │
│ │ ║ [Explanation text...]        ║ │ │
│ │ ║                              ║ │ │
│ │ ║ ○ Temporary shelter          ║ │ │
│ │ ║ ○ Long-term housing          ║ │ │
│ │ ║ ○ Emergency housing          ║ │ │
│ │ ║                              ║ │ │
│ │ ║ [Previous] [Save & Exit]     ║ │ │
│ │ ║            [Continue] →      ║ │ │
│ │ ╚══════════════════════════════╝ │ │
│ └──────────────────────────────────┘ │
│                                       │
│ ⊙ [Floating progress button]          │ ← z-50 (but fixed)
│
│ Drawer (when clicked)                 │
│ ┌──────────────────────────────────┐ │
│ │ Backdrop (z-30) - SAME AS PROGRESS │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │ Drawer Content (z-40)        │ │ │
│ │ │                              │ │ │
│ │ │ Your progress                │ │ │
│ │ │ Completion: 14%              │ │ │
│ │ │                              │ │ │
│ │ │ Questions answered: 2/14     │ │ │
│ │ │ Questions remaining: 12      │ │ │
│ │ │                              │ │ │
│ │ │ Estimated time: 3 minutes    │ │ │
│ │ │                              │ │ │
│ │ │ Progress by stage:           │ │ │
│ │ │ □ Housing Needs (67%)        │ │ │
│ │ │ □ Family Details (0%)        │ │ │
│ │ │ □ Income & Documents (0%)    │ │ │
│ │ │                              │ │ │
│ │ │ [Save & Exit]                │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
└────────────────────────────────────┘

⚠️ ISSUES:
- Progress bar: z-30 (sticky)
- Backdrop: z-30 (fixed) - SAME AS PROGRESS BAR
- Drawer: z-40 - OK but unclear hierarchy
- Progress bar sits between backdrop and drawer
- Potential visual overlap/confusion
- Progress bar may obscure drawer on some browsers
```

### AFTER (Fixed)
```
Page Layout on Mobile (< 768px):

┌────────────────────────────────────┐
│ Sticky Progress Bar (z-10)         │  ← Lower layer
│ ┌──────────────────────────────────┤ │
│ │ Stage 1/3  Question 2/14    ▰▪▪▪▪ │ │
│ └──────────────────────────────────┘ │
│                                       │
│ Main Content Area (z-0)               │
│ ┌──────────────────────────────────┐ │
│ │ [Stage Transition Banner]        │ │
│ │                                  │ │
│ │ Caseworker Chat Bubble:          │ │
│ │ "This helps me understand..."    │ │
│ │                                  │ │
│ │ ╔══════════════════════════════╗ │ │
│ │ ║ What is your housing need?  ║ │ │
│ │ ║ [Explanation text...]        ║ │ │
│ │ ║                              ║ │ │
│ │ ║ ○ Temporary shelter          ║ │ │
│ │ ║ ○ Long-term housing          ║ │ │
│ │ ║ ○ Emergency housing          ║ │ │
│ │ ║                              ║ │ │
│ │ ║ [Previous] [Save & Exit]     ║ │ │
│ │ ║            [Continue] →      ║ │ │
│ │ ╚══════════════════════════════╝ │ │
│ └──────────────────────────────────┘ │
│                                       │
│ ⊙ [Floating progress button]          │ ← z-50 (fixed FAB)
│
└────────────────────────────────────┘

When Drawer Clicked:

┌────────────────────────────────────┐
│ Sticky Progress Bar (z-10)         │  ← Stays on top of main content
│ ┌──────────────────────────────────┤ │
│ │ Stage 1/3  Question 2/14    ▰▪▪▪▪ │ │
│ └──────────────────────────────────┘ │
│                                       │
│ Backdrop (z-40)                       │ ← Semi-transparent overlay
│ ┌──────────────────────────────────┐ │
│ │  (Main content 60% visible)      │ │
│ │                                  │ │
│ │          ┌────────────────────┐  │ │
│ │          │ Your progress  [X] │  │
│ │          │                    │  │
│ │ z-50 ←── │ Completion: 14%    │  │
│ │ Drawer   │ Questions: 2/14    │  │
│ │ Content  │ Time left: 3m      │  │
│ │          │                    │  │
│ │          │ Progress by stage: │  │
│ │          │ □ Housing (67%)    │  │
│ │          │ □ Family (0%)      │  │
│ │          │ □ Income (0%)      │  │
│ │          │                    │  │
│ │          │ [Save & Exit]      │  │
│ │          │                    │  │
│ │          └────────────────────┘  │
│ │                                  │
│ └──────────────────────────────────┘ │
│                                       │
└────────────────────────────────────┘

✅ FIXES:
Z-Index Stack (clear hierarchy):
┌─────────────────┐
│ z-50: Drawer    │ ← Top layer, always visible
├─────────────────┤
│ z-40: Backdrop  │ ← Overlay that dims content
├─────────────────┤
│ z-10: Progress  │ ← Sticky, visible above main
├─────────────────┤
│ z-0: Main       │ ← Base content
└─────────────────┘

- Progress bar won't conflict with drawer
- Clear layering prevents visual confusion
- Backdrop properly dims content
- Drawer always on top
- ARIA attributes for accessibility
- Escape key support
```

---

## Key Takeaways

### Z-Index Best Practices Applied

1. **Clear Separation**: Each layer has distinct z-index value
   - `z-50` for modals/drawers (always top)
   - `z-40` for overlays/backdrops
   - `z-10` for sticky elements
   - `z-0` for main content

2. **No Overlapping Values**: Prevents conflicts and browser rendering issues

3. **Accessibility First**:
   - ARIA attributes for screen readers
   - Keyboard support (Escape key)
   - Focus management
   - Semantic HTML (role="dialog")

4. **Mobile-First Design**:
   - Proper sizing for touch targets (44x44px minimum)
   - Readable text sizes
   - Smooth animations (spring physics)

### Testing Strategy

```
Visual Testing:
├─ Desktop (1440px+) - Desktop nav only
├─ Tablet (768px-1439px) - Drawer hidden, full nav visible
└─ Mobile (< 768px)
   ├─ Drawer opens/closes smoothly
   ├─ Content behind backdrop visible (30-40% opacity)
   ├─ Close button easily tappable (44x44px)
   └─ Escape key works

Accessibility Testing:
├─ Screen Reader (NVDA/JAWS/VoiceOver)
│  ├─ Drawer announced as dialog
│  ├─ Backdrop has aria-hidden="true"
│  └─ All links/buttons announced
├─ Keyboard Navigation
│  ├─ Tab through all interactive elements
│  ├─ Shift+Tab works backwards
│  └─ Escape closes drawer
└─ WCAG 2.1 Compliance
   ├─ Level AA compliant
   ├─ Color contrast ratios OK
   └─ Focus indicators visible
```
