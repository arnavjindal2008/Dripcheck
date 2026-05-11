"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signup(formData: FormData) {
  try {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password || !name) {
      return { error: "All fields are required." };
    }

    // More robust origin detection for Vercel and local
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const redirectTo = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Signup error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred during signup" };
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
export async function forgotPassword(formData: FormData) {
  try {
    const supabase = await createClient();
    const email = formData.get("email") as string;

    if (!email) {
      return { error: "Email is required." };
    }

    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const redirectTo = `${origin}/auth/callback?next=/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Forgot password error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const supabase = await createClient();
    const password = formData.get("password") as string;

    if (!password) {
      return { error: "Password is required." };
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Reset password error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
