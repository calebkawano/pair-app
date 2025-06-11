"use client";

import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const type = searchParams.get("type");
    const access_token = searchParams.get("access_token");
    const refresh_token = searchParams.get("refresh_token");

    // If tokens are present, set the session
    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            setError(error.message);
          } else {
            router.replace("/dashboard");
          }
        });
    } else if (type === "signup" || type === "email_confirm") {
      // If just confirming email, redirect to login with a message
      router.replace("/login?confirmed=1");
    } else {
      setError("Invalid or missing authentication tokens.");
    }
  }, [router, searchParams, supabase.auth]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 font-semibold mb-4">Authentication Error</p>
        <p>{error}</p>
        <button
          className="mt-6 px-4 py-2 bg-primary text-white rounded"
          onClick={() => router.replace("/login")}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="animate-spin w-8 h-8 mb-4" />
      <p>Processing authentication...</p>
    </div>
  );
} 