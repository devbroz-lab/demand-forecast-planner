<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history — force pushing, or rebasing/amending/squashing commits that are already pushed — as it rewrites history on Lovable's side and the user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep planner domain math in pure TypeScript under `src/planner/core` so UI changes cannot alter calculations and tests can run without React.
- Load versioned static demo JSON through `src/planner/data` rather than persisting visitor selections, because the demo is intentionally private and backend-free.
- Scope the reusable planner styling with CSS Modules and public `--dfp-*` variables so a host site can theme it without style leakage.
