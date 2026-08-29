# Winemaking Techniques Page — Implementation Guide

## What Was Created

A new **Techniques page** (`techniques.html`) for your Chez Fifi staff education portal, featuring an in-depth explanation of **Méthode Champenoise** plus five complementary winemaking methods:

1. **Méthode Champenoise** — Double fermentation in bottle (featured)
2. **Charmat Method** — Tank fermentation for fresher sparklers
3. **Pét-Nat** — Bottled mid-fermentation; wild & unpredictable
4. **Solera System** — Fractional blending across decades
5. **Oxidative Aging** — Controlled oxygen exposure for depth
6. **Botrytis Cinerea** — Noble rot; nature's sweetness concentrator

## Design & Mobile Optimization

### Clean, Minimal Layout
- **Single-column on mobile**, two-column grid on desktop (768px breakpoint)
- Large, readable text (minimum 0.95rem font size)
- Generous padding and spacing — designed for touch
- Sticky header matches your existing design

### Expandable Cards (Accordion Pattern)
- **First card opens by default** — users see Méthode Champenoise immediately
- Click any card header to expand/collapse
- Only one card open at a time (better mobile UX, less scrolling)
- Smooth animations at 0.3–0.4s — snappy without feeling sluggish
- Toggle icon rotates to signal interactivity

### Visual Hierarchy
- **Gold accent color** (var(--gold) #c9a35f) used for headers, borders, tags
- **Color-coded tags** (Sparkling, Fortified, Dessert) match your category system
- Timeline visualization for step-by-step processes
- Comparison table for Charmat vs. Méthode Champenoise
- Highlighted callout boxes for key concepts

### Accessibility
- Proper heading hierarchy (h1 → h3 → h4)
- Sufficient color contrast (paper on charcoal)
- Touch targets sized for mobile (full card width clickable)
- Semantic HTML structure

## Mobile Optimizations

1. **No fixed-width content** — fluid, responsive layout
2. **Touch-friendly spacing** — 1.5rem padding, large tap targets
3. **Reduced white space on mobile** — uses CSS media queries
4. **Readable font sizes** — no font smaller than 0.9rem for body copy
5. **One-column layout** — no horizontal scrolling
6. **Fast interactions** — animations are 0.3–0.4s (fast enough to feel responsive, not jarring)
7. **Minimal JS** — only 12 lines; no external dependencies

## What to Upload to GitHub

1. **Replace these files** (already updated with Techniques link):
   - `index.html`
   - `menu.html`
   - `food-menu.html`
   - `flashcards.html`
   - `maps.html`
   - `team-quiz.html`

2. **Add this new file**:
   - `techniques.html`

That's it. The CSS is embedded in the page (no changes to `css/style.css` needed — all inline `<style>` within `techniques.html`). The JavaScript is also embedded.

## How It Works

### Frontend (User Experience)
1. Navigate to `/techniques.html`
2. See intro text and a grid of technique cards
3. Click any card to expand and read the full explanation
4. Click again to collapse
5. "Méthode Champenoise" is open by default

### Backend (Content & Updates)
- Everything is static HTML — no Google Sheet integration needed
- To add more techniques later, just add new cards to the grid
- The page is cached offline along with the rest of the site (service worker handles this automatically)

## Future Expansions

The page is built to grow. Easy additions:

- **Add more techniques**: Carbonic maceration, skin contact for whites, whole-cluster fermentation, etc.
- **Link from wine details**: Add a "Learn more about Méthode Champenoise" link in the detail overlay (`menu.html`) that jumps to the techniques page
- **Make it a source for flashcards**: Create flashcard questions around each technique (e.g., "What happens during riddling?" → Difficulty 3)
- **Add technique tags to wines**: In the Sheet, add a "technique" column so each wine links to its corresponding page

## Design Consistency Checklist

✅ **Color Palette**: Uses existing CSS variables (--charcoal, --paper, --gold, --verdigris, --bordeaux, --rose, --amber)

✅ **Typography**: Cormorant Garamond (display), Jost (body), Poiret One (accent) — all already loaded

✅ **Spacing**: Uses consistent 1rem/1.5rem/2rem increments, matching existing pages

✅ **Header/Footer**: Identical sticky header and footer as all other pages

✅ **Navigation**: Added to all six existing pages; "Techniques" sits between Flashcards and Wine Map

✅ **Mobile Breakpoints**: Matches your site's 768px media query for the two-column layout

✅ **Touch Targets**: All interactive elements are 44px+ in height (mobile best practice)

✅ **Offline Support**: Page is cached automatically via existing service worker

## What's Inside Méthode Champenoise Section

- **Definition**: What the method is, why it matters
- **Step-by-Step Timeline**: 10-step process with explanations
  - Base Wine
  - Blending (Assemblage)
  - Tirage
  - Second Fermentation
  - Aging on Lees
  - Riddling (Remuage)
  - Disgorging (Dégorgement)
  - Dosage
  - Final Cap & Rest
- **Why It Matters**: Cost justification, aging potential, bubble quality
- **On Our List**: Which Champagnes & Cavas on your menu use this method

## Testing Checklist

Before pushing live:

- [ ] Open `techniques.html` in mobile browser (iOS Safari, Chrome)
- [ ] Tap cards to expand/collapse — smooth animation?
- [ ] Scroll through timeline — text readable, spacing good?
- [ ] Open in landscape mode — layout hold up?
- [ ] Check on tablet (iPad) — two-column grid looks right?
- [ ] Desktop browser — no layout issues?
- [ ] Click from another page's nav — does it load?

## Notes

- The page uses only inline CSS and JS — no new dependencies
- Service worker caches it automatically on first visit
- Works offline after first load (like all your other pages)
- If you ever want to force a cache refresh, bump the version in `sw.js`

---

**Ready to deploy!** Upload all updated `.html` files to your GitHub repo and the new page goes live within a minute.
