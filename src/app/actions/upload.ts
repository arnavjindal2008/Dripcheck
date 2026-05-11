"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadClothingItem(file: File, name: string, category: string, type: string, color: string, weather: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("You must be logged in to upload clothes.");
  }

  const finalExt = file.name.split('.').pop() || 'png';
  const fileName = `${Math.random().toString(36).substring(2)}.${finalExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('clothes').upload(filePath, file);

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage.from('clothes').getPublicUrl(filePath);

  const { error: dbError } = await supabase.from('clothes').insert([{
    user_id: user.id,
    name,
    category,
    weather,
    image_url: publicUrl,
    type,
    color,
    status: "available"
  }]);

  if (dbError) {
    console.error("Database Insert Error:", dbError);
    throw new Error(dbError.message);
  }

  return { success: true, publicUrl };
}
