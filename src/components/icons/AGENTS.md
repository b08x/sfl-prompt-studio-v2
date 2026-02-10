# ICON COMPONENTS

**52 SVG icon components**

## OVERVIEW
Isolated SVG React components for UI icons, separated from main components directory.

## STRUCTURE
All files follow `{Name}Icon.tsx` pattern. Each exports single functional component returning inline SVG.

## WHERE TO LOOK
| Task | Action |
|------|--------|
| Add new icon | Create new `{Name}Icon.tsx` following existing pattern |
| Modify icon | Edit specific icon file (all are ~20-50 lines) |
| Find icon usage | Search components for `import {Name}Icon from` |

## CONVENTIONS
- **Naming**: PascalCase + `Icon` suffix (e.g., `MicrophoneIcon.tsx`)
- **Props**: Accept `className?: string` for Tailwind styling
- **SVG**: Inline, typically 24x24 viewBox
- **Export**: Default export of functional component

## NOTES
- 52 files makes this the largest single directory
- Icons not co-located with components that use them
- Consider moving to central `src/icons/` if exceeds 100 files
