"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  nextPath?: string;
};

export default function LoginForm({ nextPath = "/admin" }: LoginFormProps) {
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignInGithub() {
    setLoadingGithub(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo,
        scopes: "read:user user:email",
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoadingGithub(false);
      return;
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <Button
        variant="contrast"
        className="h-11 rounded-md px-5 text-sm"
        type="button"
        disabled={loadingGithub}
        onClick={onSignInGithub}
      >
        {loadingGithub ? "GitHub로 이동 중..." : "GitHub로 로그인"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
