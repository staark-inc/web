"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";

export default function LoginForm() {
  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    // IMPORTANT:
    // nu permitem browserului să facă GET /hub/login?...
    event.preventDefault();
    event.stopPropagation();

    if (loading) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      formData.get("password") ?? ""
    );

    if (!email || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/hub/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "same-origin",

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Could not sign in."
        );
      }

      if (!data?.ok) {
        throw new Error(
          data?.error ??
            "Could not sign in."
        );
      }

      // Full navigation intenționat.
      // După login serverul va primi noul
      // HttpOnly session cookie.
      window.location.assign("/hub");
    } catch (err) {
      console.error(
        "Hub login error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not sign in."
      );

      setLoading(false);
    }
  }

  return (
    <form
      className="hub-login-form"
      method="post"
      action="/api/hub/login"
      onSubmit={handleSubmit}
    >
      <div className="hub-login-field">
        <label htmlFor="hub-login-email">
          Email
        </label>

        <div className="hub-login-input">
          <Mail size={17} />

          <input
            id="hub-login-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@staarkinc.com"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="hub-login-field">
        <label htmlFor="hub-login-password">
          Password
        </label>

        <div className="hub-login-input">
          <LockKeyhole size={17} />

          <input
            id="hub-login-password"
            name="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            disabled={loading}
          />

          <button
            type="button"
            className="hub-login-password-toggle"
            onClick={() =>
              setShowPassword(
                (current) => !current
              )
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff size={17} />
            ) : (
              <Eye size={17} />
            )}
          </button>
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

            Signing in...
          </>
        ) : (
          <>
            Sign in
            <ArrowRight size={17} />
          </>
        )}
      </button>
    </form>
  );
}