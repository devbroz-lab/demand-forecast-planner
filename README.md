# Demand Forecast Planner

A demand planning dashboard demo: weekly forecasts with likely ranges, a replenishment recommendation calculated in the browser, scenario controls, a forecast replay and a guided tour. It reads static JSON files; there is no backend. The data is currently mock data for 48 fictional products.

Built with [Lovable](https://lovable.dev/projects/63b9d9b4-9b1d-40c3-a162-27fe7355553e). Changes made in the Lovable editor are committed to this repository, and pushes to `main` sync back. Never rewrite pushed history (see `AGENTS.md`).

## Development

The lockfile is Bun's.

```sh
bun install
bun run dev
bun run test
bun run lint
```

To regenerate the mock data in `public/demo-data/`, run `node mocks/generate.mjs` from the repository root.

## Structure

- `src/planner/`: the `DemandForecastPlanner` component and its scoped styles
  - `core/`: the pure ordering math and its tests
  - `data/`: the file loader and the data types (the data format)
  - `strings/`: the copy
- `src/routes/index.tsx`: the page that renders the planner
- `public/demo-data/`: the data files the page reads

To theme the planner, override the `--dfp-*` CSS variables or pass the `theme` prop.
