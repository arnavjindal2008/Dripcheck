import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const isLocalEnv = process.env.NODE_ENV === "development";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
      return NextResponse.redirect(`${isLocalEnv ? origin : siteUrl}${next}`);
    } else {
      console.error("Auth confirm error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Invalid confirmation link`);
}
