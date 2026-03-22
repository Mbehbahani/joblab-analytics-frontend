const DEFAULT_SITE_URL = 'https://job-lab-dashboard.vercel.app';

function normalizeSiteUrl(rawValue: string | undefined): string {
  const value = rawValue?.trim();
  if (!value) {
    return DEFAULT_SITE_URL;
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL,
);

export const siteName = 'JobLab Analytics';
export const organizationName = 'JobLab';
export const defaultOgImage = '/icon-light.svg';

export const siteDescription =
  'Analyze operations research, analytics, and data science job trends with interactive filters, skills insights, and geography breakdowns sourced from LinkedIn and Indeed listings.';

export const siteKeywords = [
  'operations research jobs',
  'job market analytics',
  'data science jobs dashboard',
  'skills demand analytics',
  'LinkedIn jobs insights',
  'Indeed jobs insights',
  'job trends dashboard',
  'hiring analytics',
];

export const googleSiteVerification = (
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ??
  process.env.GOOGLE_SITE_VERIFICATION
)?.trim();
