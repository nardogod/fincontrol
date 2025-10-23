import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth callback route for Supabase
 * Handles the OAuth callback and exchanges the code for a session
 *
 * This route is called after:
 * - Email confirmation
 * - OAuth providers (Google, GitHub, etc.)
 * - Magic link authentication
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect") || "/dashboard";

  if (code) {
    const supabase = createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        new URL("/login?error=auth_error", request.url)
      );
    }
  }

  // Redirect to the intended destination or dashboard
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
