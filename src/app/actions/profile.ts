"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
  full_name?: string;
  username?: string;
  avatar_url?: string;
  age?: number | string;
  address?: string;
  bio?: string;
  phone?: string;
}) {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) throw new Error("Unauthorized");

  // First check if profile exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  const profileData = {
    id: user.id,
    full_name: data.full_name,
    username: data.username,
    avatar_url: data.avatar_url,
    age: data.age ? parseInt(data.age.toString()) : null,
    address: data.address,
    bio: data.bio,
    phone: data.phone,
  };

  let error;
  if (existingProfile) {
    // Update existing
    const { error: updateError } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", user.id);
    error = updateError;
  } else {
    // Insert new
    const { error: insertError } = await supabase
      .from("profiles")
      .insert([profileData]);
    error = insertError;
  }

  if (error) {
    console.error("PROFILE PERSISTENCE ERROR:", error);
    // If it's an RLS error, provide a more helpful message
    if (error.message.includes("row-level security")) {
      throw new Error("Database Permission Error: Please ensure you have run the necessary SQL to set up Profile policies in your Supabase dashboard.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/layout");
  
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) throw new Error("Unauthorized");

  const { error: uploadError } = await supabase.storage
    .from("clothes")
    .upload(`${user.id}/avatar.png`, file, {
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage
    .from("clothes")
    .getPublicUrl(`${user.id}/avatar.png`);

  return { publicUrl: data.publicUrl };
}
