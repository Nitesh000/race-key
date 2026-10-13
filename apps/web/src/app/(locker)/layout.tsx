import { SiteHeader } from "@/components/site-header";

export default function LockerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
