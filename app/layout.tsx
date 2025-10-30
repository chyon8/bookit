import React from "react";
import { AppContextProvider } from "../context/AppContext";
import ClientLayout from "../components/ClientLayout";

export const metadata = {
  title: "Bookit ",
  description:
    "A smart reading journal to discover, track, and review your books.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Public Sans', 'sans-serif'],
                },
                colors: {
                  'primary': '#4ADE80',
                  'primary-light': '#A7F3D0',
                  'white': '#FFFFFF',
                  'light-gray': '#F8FAFC',
                  'card': '#FFFFFF',
                  'card-secondary': '#FDF1F1',
                  'text-heading': '#03314B',
                  'text-body': '#475569',
                  'text-muted': '#94A3B8',
                  'border': '#E2E8F0',
                  'footer': '#042330',
                  'accent-blue': '#38BDF8',
                  // Dark theme colors
                  'dark-bg': '#111827',
                  'dark-card': '#1F2937',
                  'dark-border': '#374151',
                  'dark-text-heading': '#F9FAFB',
                  'dark-text-body': '#D1D5DB',
                  'dark-footer': '#0d1c24',
                }
              }
            }
          }
        `,
          }}
        />
      </head>
      <body className="bg-light-gray dark:bg-dark-bg">
        <AppContextProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppContextProvider>
      </body>
    </html>
  );
}
