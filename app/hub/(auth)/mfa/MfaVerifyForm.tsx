"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function MfaVerifyForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/hub/mfa/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            code,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            "Could not verify this code."
        );
      }

      router.replace("/hub");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not verify this code."
      );
      setLoading(false);
    }
  }

  return (
    <form
      className="hub-login-form"
      onSubmit={submit}
    >
      <div className="hub-login-field">
        <label htmlFor="hub-mfa-code">
          Verification code
        </label>

        <div className="hub-login-input">
          <ShieldCheck size={17} />

          <input
            id="hub-mfa-code"
            name="code"
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="123456 or recovery code"
            value={code}
            onChange={(event) =>
              setCode(event.target.value)
            }
            required
            autoFocus
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div
          className="hub-login-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        className="hub-login-submit"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2
              size={17}
              className="hub-login-spinner"
            />
            Verifying...
          </>
        ) : (
          <>
            Verify and continue
            <ArrowRight size={17} />
          </>
        )}
      </button>

      <p className="hub-login-footer">
        Lost your authenticator? Use a
        recovery code, or contact a Staark
        administrator.
      </p>
    </form>
  );
}
