import { createClient } from "@/lib/supabase/server";
import { UserCircle, Shirt, Mail, Sparkles, MapPin, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: userClothes } = await supabase
    .from("clothes")
    .select("id")
    .eq("user_id", user.id);

  const { data: userOutfits } = await supabase
    .from("outfits")
    .select("id")
    .eq("user_id", user.id);

  const fullName = profile?.full_name || user.user_metadata?.full_name || "Fashion Enthusiast";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || "";
  const totalClothes = userClothes?.length || 0;
  const totalOutfits = userOutfits?.length || 0;

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Profile</h1>
          <p className="text-text-muted mt-2 font-medium text-base sm:text-lg">Your identity in the DripCheck universe.</p>
        </div>
      </div>

      <div className="bg-text-primary/5 backdrop-blur-2xl border border-border-color rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 sm:gap-12 shadow-2xl relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-text-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="shrink-0 relative">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={fullName} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-black/50 shadow-custom group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-text-primary/5 flex items-center justify-center border-4 border-black/50 shadow-2xl">
              <UserCircle className="w-16 h-16 sm:w-20 sm:h-20 text-text-primary/10" />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-text-primary tracking-tighter leading-tight">{fullName}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              {profile?.age && (
                <div className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest">
                  <Calendar className="w-4 h-4" />
                  <span>{profile.age} Years Old</span>
                </div>
              )}
              {profile?.address && (
                <div className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{profile.address}</span>
                </div>
              )}
            </div>
          </div>

          {profile?.bio && (
            <p className="text-text-primary/60 text-base sm:text-lg font-medium leading-relaxed max-w-xl italic underline decoration-white/5 underline-offset-8">
              &quot;{profile.bio}&quot;
            </p>
          )}

          <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-8 border-t border-white/5">
            <div className="flex flex-col">
              <p className="text-[10px] text-text-primary/20 font-black uppercase tracking-[0.2em] mb-2">Wardrobe Size</p>
              <div className="flex items-center gap-3">
                <Shirt className="w-5 h-5 sm:w-6 sm:h-6 text-text-primary/80" />
                <span className="text-2xl sm:text-3xl font-black text-text-primary leading-none">{totalClothes}</span>
              </div>
            </div>

            <div className="w-px h-12 bg-text-primary/5 self-end mx-2 hidden sm:block" />

            <div className="flex flex-col">
              <p className="text-[10px] text-text-primary/20 font-black uppercase tracking-[0.2em] mb-2">Looks Saved</p>
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                <span className="text-2xl sm:text-3xl font-black text-text-primary leading-none">{totalOutfits}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileForm profile={profile} user={user} />
    </div>
  );
}
