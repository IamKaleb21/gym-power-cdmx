# Design System Theme
 
## Color Palette
 
This design system uses a **dark** color mode, providing a modern and sophisticated aesthetic. The primary brand color is a striking **#CCFF00**, a vibrant lime green that captures attention. It is complemented by a dark **#212121** as a secondary color, offering strong contrast and depth. A foundational **#121212** serves as the neutral color for backgrounds and general UI elements.
 
-   **Primary Color**: `#CCFF00` (Vibrant Lime Green)
-   **Secondary Color**: `#212121` (Dark Gray)
-   **Neutral Color**: `#121212` (Near Black)
 
## Typography
 
The typography strategy employs a clear hierarchy and readability.
 
-   **Headlines**: `spaceGrotesk` is chosen for its distinct, modern character, making headlines impactful.
-   **Body Text**: `inter` ensures high legibility and a clean appearance for all body content.
-   **Labels**: `inter` is also used for labels, maintaining consistency and clarity across interactive elements.
 
## Shape and Form
 
The UI elements feature a **subtle roundedness (1)**, creating a soft yet defined aesthetic without being overly angular or cartoonish. This roundedness contributes to a friendly and approachable feel.
 
## Spacing
 
The design adopts a **normal (2)** level of spacing. This balanced approach provides adequate whitespace for readability and visual comfort, preventing elements from feeling too cramped or excessively spread out.

## Implementation tokens (codebase)

Production UI often uses **`#cafd00`** for primary accents (lime) and **`#0e0e0e`** / surface tokens for admin backgrounds—slightly different hex labels than the palette above, but the same intent (dark shell + neon lime).

## Admin shell (`/admin`)

- **Desktop (`lg+`):** Fixed left sidebar with brand, vertical nav, and **Add Member** CTA. No duplicate top bar (brand lives in the sidebar).
- **Mobile:** Top bar with **GYM POWER CDMX** only; **bottom navigation** shows the **same six sections** as desktop (Dashboard, Members, Classes, Trainers, Payments, Scan). Items use **equal flex columns** (`flex-1`) so the bar uses the **full viewport width**—no horizontal clustering or scroll.
- **Admin content:** List and analytics views use **full width** of the main column (`w-full min-w-0`) with responsive horizontal padding (`lg` / `xl` / `2xl`), not a centered `max-w-*` column, so charts and tables can breathe on large monitors.