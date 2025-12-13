import React from "react";
import { AppContextProvider } from "../context/AppContext";
import ClientLayout from "../components/ClientLayout";
import ToastProvider from "../components/ToastProvider"; // Import ToastProvider

export const metadata = {
  title: "Bookit",
  description:
    "A smart reading journal to discover, track, and review your books.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
            `,
          }}
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Pretendard', 'sans-serif'],
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
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </head>
      <body className="bg-light-gray dark:bg-dark-bg">
        <AppContextProvider>
          <ClientLayout>{children}</ClientLayout>
          <ToastProvider /> {/* Use ToastProvider here */}
        </AppContextProvider>
      </body>
    </html>
  );
}
