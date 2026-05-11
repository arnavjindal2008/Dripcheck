"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAsLaundry(id: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("clothes")
    .update({ status: "laundry" })
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Update failed — no rows matched");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/wardrobe");
  revalidatePath("/dashboard/laundry");
  revalidatePath("/dashboard/outfits");

  return { success: true };
}

export async function markAsAvailable(id: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("clothes")
    .update({ status: "available" })
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Update failed — no rows matched");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/wardrobe");
  revalidatePath("/dashboard/laundry");
  revalidatePath("/dashboard/outfits");

  return { success: true };
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Delete any outfits referencing this clothing item first to avoid FK constraint errors
  await supabase
    .from("outfits")
    .delete()
    .or(`top_id.eq.${id},bottom_id.eq.${id},shoes_id.eq.${id}`);

  const { error } = await supabase
    .from("clothes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/wardrobe");
  revalidatePath("/dashboard/laundry");
  revalidatePath("/dashboard/outfits");

  return { success: true };
}

export async function editItem(id: string, updates: { name: string, type: string, color: string, category: string, weather?: string }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("clothes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    console.error("Database Update Error:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Update failed — no rows matched");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/wardrobe");
  revalidatePath("/dashboard/laundry");
  revalidatePath("/dashboard/outfits");

  return { success: true };
}

export async function bulkUpdateStatus(ids: string[], status: "available" | "laundry") {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("clothes")
    .update({ status })
    .in("id", ids)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/wardrobe");
  revalidatePath("/dashboard/laundry");
  revalidatePath("/dashboard/outfits");

  return { success: true };
}

export async function bulkDeleteItems(ids: string[]) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) throw new Error("Unauthorized");

  // Delete associated outfits for each item
  const { error: outfitError } = await supabase
    .from("outfits")
    .delete()
    .in("top_id", ids);
    
  if (outfitError) console.error("Error deleting related outfits:", outfitError);
    
  // More thorough outfit deletion could be done but this covers primary cases

  const { error } = await supabase
    .from("clothes")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/wardrobe");
  revalidatePath("/dashboard/laundry");
  revalidatePath("/dashboard/outfits");

  return { success: true };
}
