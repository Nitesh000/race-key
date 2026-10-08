import { SiteHeader } from "@/components/site-header";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
