import '@mantine/core/styles.css';
import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';
import { DataProvider } from '@/providers/DataProvider';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import {
  defaultOgImage,
  googleSiteVerification,
  organizationName,
  siteDescription,
  siteKeywords,
  siteName,
  siteUrl,
} from '@/lib/seo';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export function generateMetadata(): Metadata {
  const pageTitle = `${siteName} | Operations Research Job Market Dashboard`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: pageTitle,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    applicationName: siteName,
    keywords: siteKeywords,
    authors: [{ name: organizationName }],
    creator: organizationName,
    publisher: organizationName,
    referrer: 'origin-when-cross-origin',
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: '/',
      title: pageTitle,
      description: siteDescription,
      siteName,
      images: [
        {
          url: defaultOgImage,
          width: 300,
          height: 300,
          alt: `${siteName} logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: siteDescription,
      images: [defaultOgImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    verification: googleSiteVerification
      ? { google: googleSiteVerification }
      : undefined,
    category: 'data analytics',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: inter.style.fontFamily,
  defaultRadius: 'md',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  components: {
    Paper: {
      defaultProps: {
        shadow: 'xs',
      },
    },
    AppShell: {
      styles: {
        main: {
          backgroundColor: 'var(--mantine-color-body)',
        },
      },
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CNSTMFDSV6"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CNSTMFDSV6', { anonymize_ip: true });
          `}
        </Script>

        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-532X67LP');
          `}
        </Script>

        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-532X67LP"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        <MantineProvider theme={theme} defaultColorScheme="light">
          <DataProvider>
            {children}
          </DataProvider>
        </MantineProvider>
        <Analytics />
      </body>
    </html>
  );
}
