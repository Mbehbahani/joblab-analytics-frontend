import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  defaultOgImage,
  siteDescription,
  siteKeywords,
  siteName,
  siteUrl,
} from '@/lib/seo';

const dashboardDescription =
  'Explore operations research and data science hiring trends with interactive charts, filterable job data, skill demand analysis, and geographic insights.';

const dashboardTitle = `${siteName} Dashboard`;

const dashboardStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: dashboardTitle,
  description: dashboardDescription,
  url: `${siteUrl}/dashboard`,
  isPartOf: {
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: siteDescription,
  },
  about: [
    'Operations research jobs',
    'Data science jobs',
    'Job market analytics',
    'Skills demand trends',
  ],
};

export const metadata: Metadata = {
  title: 'Dashboard',
  description: dashboardDescription,
  keywords: [...siteKeywords, 'job analytics dashboard', 'hiring trends'],
  alternates: {
    canonical: '/dashboard',
  },
  openGraph: {
    type: 'website',
    url: '/dashboard',
    title: dashboardTitle,
    description: dashboardDescription,
    siteName,
    images: [
      {
        url: defaultOgImage,
        width: 300,
        height: 300,
        alt: `${siteName} dashboard`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: dashboardTitle,
    description: dashboardDescription,
    images: [defaultOgImage],
  },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        // Intentional inline JSON-LD for better search engine understanding of dashboard content.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dashboardStructuredData),
        }}
      />
      {children}
    </>
  );
}
