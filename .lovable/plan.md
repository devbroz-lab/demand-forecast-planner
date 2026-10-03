# Demand analytics dashboard redesign

## Experience
- Reframe the first screen as a dense analytics workspace rather than an ordering product. Keep the existing white, pale-gray, blue, and ink palette; use Sora for headings and Manrope for body text. Follow the selected Precision Analytics Matrix composition: compact utility header and product filters, four aligned summary metrics, a broad forecast analysis area, and a restrained right-hand panel for replenishment logic and scenario inputs. Use crisp borders, square-to-small corners, tabular figures, and restrained motion.
- Turn the large blue “Your next order / Order now” treatment into neutral analytical output: recommended quantity and timing, cash exposure, inventory position, safety stock, and risk. Preserve the existing calculation and Indian-number formatting; do not introduce the selected prototype’s unrelated or fabricated accuracy, procurement, or export actions.
- Keep the forecast chart, chart/table switch, replay, drivers, what-if controls, and model-versus-baseline outcomes in a clear data hierarchy. On narrow screens, stack the same information and retain reachable controls.

## Guided walkthrough
- Replace the separate “How it works” page with an on-page, step-by-step walkthrough that opens on landing after the dashboard has loaded. Spotlight the actual product selection, summary figures, forecast, replenishment logic, scenario controls, drivers, replay, and impact comparison in sequence.
- Add a small, persistent “Tour” control to restart it. Provide Back, Next, Skip/Close, step count, keyboard-accessible dialog behavior, and sensible scrolling/focus for each highlighted section. Do not save visitor tour state.

## Wording and disclosure
- Remove the synthetic-data banner, mock-data badges, separate “Assumptions & limits” page, and repeated demo/synthetic language from the visible dashboard, including footer, chart, provenance, and summary copy. Keep labels accurate and analytical; do not imply data is live or operational. Preserve necessary data limitations in a concise, contextual note where a metric genuinely needs interpretation rather than a promotional disclaimer.
- Refresh the page title and social description to describe the demand analytics workspace without repetitive demo claims.

## Technical approach and checks
- Make presentation changes in the planner component, its scoped CSS Module, copy strings, and page metadata; leave forecast fixtures and pure ordering math unchanged. Continue using public `--dfp-*` styling hooks for host-site theming.
- Verify the first-load tour, restart/skip/back/next controls, product and scenario updates, chart/table and replay, plus desktop and narrow-screen layouts. Check for clipped text, overlap, console errors, and current preview build diagnostics.
