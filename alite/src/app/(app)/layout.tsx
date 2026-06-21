import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Mobile Sticky Top Header */}
      <header className="sticky top-0 inset-x-0 h-14 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 flex items-center justify-between z-30 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6.5 h-6.5 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-black text-xs">A</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">Alite</span>
        </Link>
        <ThemeToggle className="scale-85" />
      </header>

      <Navigation />

      <main id="main-content" className="md:pl-56 pb-28 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}