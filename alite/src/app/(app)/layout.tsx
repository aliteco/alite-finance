import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense-in-depth: middleware.ts is the primary guard and runs first,
  // but this protects direct hits in edge cases (e.g. middleware matcher misses).
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      <Navigation />

      <main id="main-content" className="md:pl-56 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}