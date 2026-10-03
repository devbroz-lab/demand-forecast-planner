import { createFileRoute } from '@tanstack/react-router';
import { DemandForecastPlanner } from '@/planner/DemandForecastPlanner';
export const Route = createFileRoute('/')({
 head: () => ({ meta: [
   { title: 'Demand Planning Dashboard | Harrow & Vale' },
   { name: 'description', content: 'Weekly demand, replenishment and inventory outcomes for the Harrow & Vale assortment.' },
   { property: 'og:title', content: 'Demand Planning Dashboard | Harrow & Vale' },
   { property: 'og:description', content: 'Weekly demand, replenishment and inventory outcomes for the Harrow & Vale assortment.' },
  { property: 'og:type', content: 'website' },
  { name: 'twitter:card', content: 'summary_large_image' }
 ] }),
 component: () => <DemandForecastPlanner dataBaseUrl="/demo-data/" ctaHref="https://www.devbroz.com/#contact" />,
});
