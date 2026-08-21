import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "damm. — Rooftop Wine Space",
  description:
    "damm. is a rooftop wine bar in Baku. Reserve a table, browse the wine list and menu, and join us open-air from 18:00 to 02:00.",
};

const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('damm-theme');
    var theme = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
