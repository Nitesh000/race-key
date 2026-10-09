import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="block text-center font-mono text-2xl font-bold">
          race<span className="text-accent">-</span>key
        </Link>
        {children}
      </div>
    </main>
  );
}
