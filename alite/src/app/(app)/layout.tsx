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

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAVIGATION (fixed UI) */}
      <Navigation />

      {/* PAGE CONTENT MUST BE OFFSET */}
      <main className="md:pl-56 pb-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}