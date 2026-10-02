import { createFileRoute } from '@tanstack/react-router';
import { DemandForecastPlanner } from '@/planner/DemandForecastPlanner';
export const Route = createFileRoute('/')({
 head: () => ({ meta: [
  { title: 'Demand Forecast & Reorder Planner | Forecast Lab' },
  { name: 'description', content: 'Explore a demand forecast, adjust stock scenarios, and see live reorder recommendations on synthetic FMCG data.' },
  { property: 'og:title', content: 'Demand Forecast & Reorder Planner | Forecast Lab' },
  { property: 'og:description', content: 'An interactive synthetic-data demo for forecasting demand and planning smarter orders.' },
  { property: 'og:type', content: 'website' },
  { name: 'twitter:card', content: 'summary_large_image' }
 ] }),
 component: () => <DemandForecastPlanner dataBaseUrl="/demo-data/" ctaHref="#contact" />,
});
