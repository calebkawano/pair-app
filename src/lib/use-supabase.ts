import { logger } from "@/lib/logger";
import { Database } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ------------------------------------------------------------
// Browser-side: memoise a single Supabase client across renders
// ------------------------------------------------------------
let _browserClient: SupabaseClient<Database> | null = null;
function getBrowserClient() {
  if (!_browserClient) {
    // Dynamically import to avoid bundling server code in browser
    const { createBrowserClient } = require("@supabase/ssr");
    _browserClient = createBrowserClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
    ) as SupabaseClient<Database>;
  }
  return _browserClient!;
}

// ------------------------------------------------------------
// Server-side helper – creates per-request client (no memoisation)
// ------------------------------------------------------------
function getServerClient() {
  // Dynamically import server-only modules to avoid bundling them in the client build
  const { cookies } = require("next/headers");
  const { createServerClient } = require("@supabase/ssr");

  const cookieStore = cookies();
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value ?? null,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            logger.error({ error }, "Supabase cookie set failed");
          }
        },
        remove: (name: string, options: Record<string, unknown>) => {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch (error) {
            logger.error({ error }, "Supabase cookie remove failed");
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
      },
      global: {
        headers: { "x-application-name": "pair-app" },
      },
    },
  ) as SupabaseClient<Database>;
}

// ------------------------------------------------------------
// Public hooks
// ------------------------------------------------------------

export function useSupabase(): SupabaseClient<Database> {
  // Always call useMemo to satisfy Rules of Hooks
  return useMemo(() => {
    // In the browser we memoise a singleton; on the server we create a
    // per-request instance (hooks are not allowed there).
    if (typeof window === "undefined") {
      return getServerClient();
    }
    return getBrowserClient();
  }, []);
}

/**
 * Returns the user's active household UUID using a single RPC call.
 * Falls back to `null` if the RPC fails or the user isn't linked yet.
 */
export function useActiveHousehold() {
  const supabase = useSupabase();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      if (mounted && isLoading) {
        logger.warn("useActiveHousehold timeout - setting to null");
        setHouseholdId(null);
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout
    
    (async () => {
      try {
        setIsLoading(true);
        let id: string | null = null;

        // Get authenticated user
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser();

        if (!authErr && user) {
          // 1) Try first household membership
          const { data: membershipRows } = await supabase
            .from("household_members")
            .select("household_id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          id = membershipRows?.household_id ?? null;

          // 2) Fallback: personal household by creator
          if (!id) {
            const { data: personalRow } = await supabase
              .from("households")
              .select("id")
              .eq("created_by", user.id)
              .eq("is_personal", true)
              .maybeSingle();

            id = personalRow?.id ?? null;
          }
        }

        if (mounted) {
          setHouseholdId(id);
          setIsLoading(false);
        }
      } catch (error) {
        logger.error({ error }, "Unhandled active household error");
        if (mounted) {
          setHouseholdId(null);
          setIsLoading(false);
        }
      }
    })();
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [supabase, isLoading]);

  return householdId;
} 