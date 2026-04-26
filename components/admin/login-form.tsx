"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  nextPath?: string;
};

export default function LoginForm({ nextPath = "/admin" }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignInWithPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form className="mt-5 flex flex-col gap-4" onSubmit={onSignInWithPassword}>
      <div className="space-y-2">
        <p className="korean-display text-base text-foreground/90">이메일</p>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="관리자 이메일"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 rounded-none bg-muted/25 px-4 text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <p className="korean-display text-base text-foreground/90">비밀번호</p>
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 rounded-none bg-muted/25 px-4 text-base"
          required
        />
      </div>
      <Button
        variant="default"
        className="mt-2 h-12 rounded-none px-6 text-base"
        type="submit"
        disabled={loading}
      >
        {loading ? "로그인 중..." : "로그인"}
      </Button>

      {error ? (
        <p className="text-base text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
