import { Shirt, Sparkles, WashingMachine } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClothingItem } from "@/components/ClothingCard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [clothesResponse, outfitsResponse] = await Promise.all([
    supabase
      .from("clothes")
      .select("*")
      .eq("user_id", user.id),
    supabase
      .from("outfits")
      .select("id")
      .eq("user_id", user.id)
  ]);

  const safeClothes = clothesResponse.data ?? [];
  const safeOutfits = outfitsResponse.data ?? [];

  const totalItems = safeClothes.length;
  const laundryItems = safeClothes.filter((item: ClothingItem) => item.status === "laundry").length;
  const savedOutfits = safeOutfits.length;

  const categoryCount = safeClothes.reduce((acc: Record<string, number>, item: ClothingItem) => {
    if (item.category) acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.keys(categoryCount).length > 0
    ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
    : "None";

  const colorCount = safeClothes.reduce((acc: Record<string, number>, item: ClothingItem) => {
    if (item.color) acc[item.color] = (acc[item.color] || 0) + 1;
    return acc;
  }, {});

  const recentItems = [...safeClothes].sort((a: ClothingItem, b: ClothingItem) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 5);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary">
          Hey {user.user_metadata?.full_name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-text-muted mt-2 text-base sm:text-lg font-medium">Your wardrobe is looking sharp today.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-text-primary/5 backdrop-blur-lg border border-border-color p-3 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center gap-2 sm:gap-4 shadow-xl hover:bg-text-primary/10 transition-all duration-300 group cursor-default">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-text-primary/10 flex items-center justify-center text-text-primary shrink-0 group-hover:scale-110 transition-transform duration-500">
            <Shirt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.15em] truncate">Total Items</p>
            <p className="text-xl sm:text-2xl font-black text-text-primary leading-none mt-1 group-hover:translate-x-1 transition-transform duration-500">{totalItems}</p>
          </div>
        </div>
        <Link href="/dashboard/history" className="bg-text-primary/5 backdrop-blur-lg border border-border-color p-3 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center gap-2 sm:gap-4 shadow-xl hover:bg-text-primary/10 transition-all duration-300 group cursor-pointer">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 border border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.15em] truncate">Looks Saved</p>
            <p className="text-xl sm:text-2xl font-black text-text-primary leading-none mt-1 group-hover:translate-x-1 transition-transform duration-500">{savedOutfits}</p>
          </div>
        </Link>
        <div className="bg-text-primary/5 backdrop-blur-lg border border-border-color p-3 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center gap-2 sm:gap-4 shadow-xl hover:bg-text-primary/10 transition-all duration-300 group cursor-default">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
            <WashingMachine className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.15em] truncate">In Laundry</p>
            <p className="text-xl sm:text-2xl font-black text-text-primary leading-none mt-1 group-hover:translate-x-1 transition-transform duration-500">{laundryItems}</p>
          </div>
        </div>
        <div className="bg-text-primary/5 backdrop-blur-lg border border-border-color p-3 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center gap-2 sm:gap-4 shadow-xl hover:bg-text-primary/10 transition-all duration-300 group cursor-default">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
            <Shirt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.15em] truncate">Top Category</p>
            <p className="text-lg sm:text-xl font-black text-text-primary leading-none mt-1 capitalize truncate group-hover:translate-x-1 transition-transform duration-500">{topCategory}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="relative group overflow-hidden bg-[image:var(--gradient-primary)] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white flex flex-col justify-between items-start min-h-[200px] sm:min-h-[240px] shadow-[var(--shadow-lg)] border border-primary/20">
          <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
            <Sparkles className="w-24 h-24 sm:w-32 sm:h-32" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-2 sm:mb-3 tracking-tight">AI Outfit Engine</h2>
            <p className="text-white/80 max-w-[240px] sm:max-w-xs font-medium text-base sm:text-lg leading-snug sm:leading-relaxed">Let AI craft the perfect look from your wardrobe.</p>
          </div>
          <Link href="/dashboard/outfits" className="relative z-10 mt-6 sm:mt-8 bg-white text-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all shadow-xl">
            Generate Now
          </Link>
        </div>

        <div className="bg-[image:var(--gradient-hero)] dark:bg-card border border-border-color rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col justify-between items-start min-h-[200px] sm:min-h-[240px] shadow-[var(--shadow-md)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 sm:p-8 text-primary/10 dark:text-text-primary/5 group-hover:scale-110 transition-transform duration-700">
            <Shirt className="w-24 h-24 sm:w-32 sm:h-32" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-2 sm:mb-3 tracking-tight">Add Items</h2>
            <p className="text-text-secondary max-w-[240px] sm:max-w-xs font-medium text-base sm:text-lg leading-snug sm:leading-relaxed">Upload clothes and we&apos;ll automatically remove the backgrounds.</p>
          </div>
          <Link href="/dashboard/upload" className="relative z-10 mt-6 sm:mt-8 bg-background border border-border-color text-text-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm uppercase tracking-widest hover:bg-surface-hover dark:hover:bg-muted active:scale-95 transition-all shadow-xl">
            Upload Clothes
          </Link>
        </div>
      </div>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">Recent Drops</h2>
            <Link href="/dashboard/wardrobe" className="text-text-muted text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:text-text-primary transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
            {recentItems.map((item: ClothingItem) => (
              <Link key={item.id} href="/dashboard/wardrobe" className="group bg-text-primary/5 backdrop-blur-lg border border-border-color rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-square bg-background/20 relative flex items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url} alt={item.name || item.type} className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-4 border-t border-white/5 bg-white/[0.01] flex flex-col justify-center h-[70px] sm:h-[80px]">
                  <p className="text-[10px] sm:text-xs font-black capitalize text-text-primary/90 leading-tight line-clamp-2">
                    {item.name || `${item.color} ${item.type}`}
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{item.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
