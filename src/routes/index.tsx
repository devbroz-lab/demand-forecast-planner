import { createFileRoute } from '@tanstack/react-router';
import { DemandForecastPlanner } from '@/planner/DemandForecastPlanner';
export const Route = createFileRoute('/')({
 head: () => ({ meta: [
   { title: 'Demand Planning Dashboard | Forecast Lab' },
   { name: 'description', content: 'Explore demand forecasts, inventory position, replenishment scenarios and business outcomes in one analytics workspace.' },
   { property: 'og:title', content: 'Demand Planning Dashboard | Forecast Lab' },
   { property: 'og:description', content: 'Forecast demand, examine replenishment logic and compare inventory outcomes in an interactive analytics workspace.' },
  { property: 'og:type', content: 'website' },
  { name: 'twitter:card', content: 'summary_large_image' }
 ] }),
 component: () => <DemandForecastPlanner dataBaseUrl="/demo-data/" ctaHref="#contact" />,
});
