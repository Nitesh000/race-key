import { SiteHeader } from "@/components/site-header";

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
