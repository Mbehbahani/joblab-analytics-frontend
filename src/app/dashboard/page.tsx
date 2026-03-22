'use client';

import dynamic from 'next/dynamic';

const DashboardClient = dynamic(() => import('./DashboardClient').then(mod => ({ default: mod.DashboardClient })), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>
});

export default function DashboardPage() {
  return <DashboardClient />;
}
