import { useState, type FormEvent } from "react";
import { sendCode, useSession, verifyCode } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-fg-faint text-sm">
        Loading…
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  return <>{children}</>;
}

type Step = "email" | "code";

function LoginScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setErr(null);
    try {
      await sendCode(email);
      setStep("code");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: FormEvent) {
    e.preventDefault();
    if (code.length < 6) return;
    setBusy(true);
    setErr(null);
    try {
      await verifyCode(email, code);
      // useSession picks up the new session via onAuthStateChange.
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setErr(null);
    try {
      await sendCode(email);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="w-80 space-y-6">
        <div className="text-center">
          <div className="font-serif text-3xl italic">Verbatim</div>
          <div className="mt-2 text-sm text-fg-muted">Local-first writing.</div>
        </div>

        {step === "email" && (
          <form onSubmit={submitEmail} className="space-y-3">
            <p className="text-xs text-fg-muted">
              Enter your email. We'll send a 6-digit code (and a magic link).
            </p>
            <input
              autoFocus
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elev px-3 py-2 text-sm outline-none focus:border-fg-muted"
            />
            <button
              type="submit"
              disabled={busy || !email}
              className="w-full rounded-md bg-fg px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send code"}
            </button>
            {err && <p className="text-xs text-red-400">{err}</p>}
          </form>
        )}

        {step === "code" && (
          <form onSubmit={submitCode} className="space-y-3">
            <p className="text-xs text-fg-muted">
              We sent a code to <span className="text-fg">{email}</span>.
            </p>
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full rounded-md border border-border bg-bg-elev px-3 py-3 text-center font-mono text-lg tracking-widest outline-none focus:border-fg-muted"
            />
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="w-full rounded-md bg-fg px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Verifying…" : "Verify"}
            </button>
            <div className="flex justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-fg-faint hover:text-fg-muted"
              >
                ← change email
              </button>
              <button
                type="button"
                onClick={() => void resend()}
                className="text-fg-faint hover:text-fg-muted"
              >
                resend
              </button>
            </div>
            {err && <p className="text-xs text-red-400">{err}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
