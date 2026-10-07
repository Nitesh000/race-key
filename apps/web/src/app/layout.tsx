import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { SettingsBoot } from "@/features/settings/settings-boot";
import { MODE_COOKIE, THEME_COOKIE, parseMode, parseTheme } from "@/features/themes/cookies";
import { ThemeProvider } from "@/features/themes/theme-provider";
import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "race-key", template: "%s · race-key" },
  description: "Free multiplayer typing races on passages from real books.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);
  const mode = parseMode(jar.get(MODE_COOKIE)?.value);

  return (
    <html lang="en" data-theme={theme} data-mode={mode} className={fontVariables}>
      <body className="bg-bg font-sans text-text">
        <ThemeProvider initialTheme={theme} initialMode={mode}>
          <SettingsBoot />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
