export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user || authError) {
    redirect("/login");
  }

  // Fetch profile with maybeSingle to avoid errors if not exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, username, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || "?";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
  
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col md:flex-row overflow-x-hidden transition-colors duration-300">
      <Sidebar />

      {/* Mobile Top Header */}
      <div className="md:hidden flex justify-between items-center px-6 py-4 border-b border-border-color w-full sticky top-0 bg-background/80 backdrop-blur-xl z-50">
        <Link href="/dashboard" className="flex items-center">
          <img src="/logo.png" alt="DripCheck Logo" className="h-12 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center mr-2">
            <ThemeToggle />
          </div>
          <Link href="/dashboard/profile" className="w-10 h-10 rounded-full border border-border-color overflow-hidden bg-text-primary/5 flex items-center justify-center transition-transform active:scale-90">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center select-none"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)" }}
              >
                <span className="text-[11px] font-black text-white uppercase tracking-tighter">
                  {initials}
                </span>
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-0 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
