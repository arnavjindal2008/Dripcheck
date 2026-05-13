import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const type = searchParams.get("type") ?? "signup";

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, siteUrl));
    } else {
      // If code exchange fails, check if we actually have a session now
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.redirect(new URL(next, siteUrl));
      }

      console.error("Auth callback error:", error.message);
      const errorUrl = new URL("/login", siteUrl);
      errorUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(errorUrl);
    }
  }

  // Handle token_hash
  const tokenHash = searchParams.get("token_hash");
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email",
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, siteUrl));
    }
  }

  // No valid auth code/token
  const errorUrl = new URL("/login", siteUrl);
  errorUrl.searchParams.set("error", "Invalid or expired authentication link");
  return NextResponse.redirect(errorUrl);
}
