"use client";

import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  nextPath?: string;
};

export default function LoginForm({ nextPath = "/admin" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`;

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setNotice("로그인 링크를 이메일로 보냈습니다. 메일에서 링크를 눌러 로그인해주세요.");
    setLoading(false);
  }

  return (
    <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
      <label className="text-sm text-muted-foreground" htmlFor="email">
        관리자 이메일
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="h-11 rounded-[var(--radius-md)] border border-input bg-transparent px-3 text-sm text-foreground"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <button
        className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity duration-[var(--motion-normal)] hover:opacity-90 disabled:opacity-70"
        type="submit"
        disabled={loading}
      >
        {loading ? "메일 발송 중..." : "이메일로 로그인 링크 받기"}
      </button>

      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
