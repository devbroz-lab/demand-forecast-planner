# Keep the guided tour visible throughout

## Fix
- Separate the dimming layer, highlighted dashboard section, and tour guide into a clear stacking order. The highlighted section stays above the dimming layer, while the guide and its controls stay above every highlighted section, including the final model-comparison section shown in the screenshot.
- Prevent the guide from covering the section it is explaining: place it on the available side of the viewport, with a compact mobile position that remains clear of the bottom controls and any open controls drawer. Keep scrolling, focus, Back/Next/Skip/Finish, and restart behavior intact.

## Checks
- Walk through every step on desktop and narrow mobile screens, including the first and last steps, and confirm the guide, highlight, and controls are visible and clickable without overlap or clipping.
- Verify keyboard navigation and current preview diagnostics; do not change forecast data or calculations.

## Technical note
- The current guide lives inside a lower stacking layer than highlighted sections, so its child z-index cannot rise above them. Rework the tour layers rather than increasing the guide's child z-index alone.
