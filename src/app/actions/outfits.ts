"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAvailableClothesForOutfits() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("You must be logged in to generate outfits.");
  }

  const { data: userClothes, error: fetchError } = await supabase
    .from('clothes')
    .select('*')
    .eq('user_id', user.id);
    
  if (fetchError) {
    console.error("FETCH CLOTHES ERROR:", fetchError);
    throw new Error(fetchError.message);
  }
  
  return userClothes || [];
}

export async function saveOutfitAction(topId: string, bottomId?: string | null, shoesId?: string | null) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) throw new Error("Unauthorized");
  
  console.log("Saving outfit:", { topId, bottomId, shoesId });

  const { error } = await supabase.from('outfits').insert({
    user_id: user.id,
    top_id: topId,
    bottom_id: bottomId || null,
    shoes_id: shoesId || null
  });
  
  if (error) {
    console.error("SAVE OUTFIT ERROR:", error);
    throw new Error(error.message);
  }
  
  revalidatePath("/dashboard/history");
  
  return { success: true };
}

export async function getHistoryOutfits() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  console.log("Fetching history for user:", user.id);

  const { data: outfitsData, error: outfitsError } = await supabase
    .from('outfits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (outfitsError) {
    console.error("FETCH OUTFITS ERROR:", outfitsError);
    // If table doesn't exist, this will fail. 
    // Common error code for missing table is '42P01'
    if (outfitsError.code === '42P01') {
      throw new Error("The 'outfits' table does not exist in your database. Please create it using the SQL Editor.");
    }
    throw new Error(outfitsError.message);
  }
  
  if (!outfitsData || outfitsData.length === 0) return [];

  const { data: clothesData, error: clothesError } = await supabase
    .from('clothes')
    .select('*')
    .eq('user_id', user.id);

  if (clothesError) {
    console.error("FETCH CLOTHES FOR HISTORY ERROR:", clothesError);
    throw new Error(clothesError.message);
  }

  const clothesMap = new Map(clothesData?.map(c => [c.id, c]) || []);

  const reconstructed = outfitsData.map(o => ({
    ...o,
    top: clothesMap.get(o.top_id),
    bottom: clothesMap.get(o.bottom_id),
    shoes: o.shoes_id ? clothesMap.get(o.shoes_id) : undefined,
  }));

  return reconstructed;
}

export async function toggleFavoriteAction(id: string, currentFav: boolean) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('outfits')
    .update({ favorite: !currentFav })
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteOutfitAction(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('outfits')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}
