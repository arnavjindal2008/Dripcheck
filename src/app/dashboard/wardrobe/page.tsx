import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WardrobeClient from "./WardrobeClient";

export default async function WardrobePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: clothes, error } = await supabase
    .from("clothes")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
        Failed to load wardrobe data: {error.message}
      </div>
    );
  }

  return <WardrobeClient initialClothes={clothes || []} />;
}
