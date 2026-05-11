import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, username")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col md:flex-row overflow-x-hidden transition-colors duration-300">
      <Sidebar />

      {/* Mobile Top Header */}
      <div className="md:hidden flex justify-between items-center px-6 py-4 border-b border-border-color w-full sticky top-0 bg-background/80 backdrop-blur-xl z-50">
        <a href="/dashboard" className="flex items-center">
          <img src="/logo.png" alt="DripCheck Logo" className="h-12 w-auto object-contain" />
        </a>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center mr-2">
            <ThemeToggle />
          </div>
          <a href="/dashboard/profile" className="w-10 h-10 rounded-full border border-border-color overflow-hidden bg-text-primary/5 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-black text-text-muted uppercase">{profile?.username?.substring(0, 2) || "ME"}</span>
            )}
          </a>
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
