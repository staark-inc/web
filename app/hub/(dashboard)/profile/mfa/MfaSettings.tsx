"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

type Enrollment = {
  secret: string;
  otpauthUrl: string;
  expiresAt: string;
};

async function postJson(
  path: string,
  body: Record<string, unknown>
) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error(
      data?.error ||
        "The request could not be completed."
    );
  }

  return data;
}

export default function MfaSettings({
  enabled: initialEnabled,
}: {
  enabled: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] =
    useState(initialEnabled);
  const [enrollment, setEnrollment] =
    useState<Enrollment | null>(null);
  const [recoveryCodes, setRecoveryCodes] =
    useState<string[]>([]);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] =
    useState("");
  const [currentPassword, setCurrentPassword] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

  async function startEnrollment() {
    setLoading(true);
    setError("");

    try {
      const data = await postJson(
        "/api/hub/mfa/enroll",
        {}
      );
      setEnrollment({
        secret: data.secret,
        otpauthUrl: data.otpauthUrl,
        expiresAt: data.expiresAt,
      });
      setCode("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not start enrollment."
      );
    } finally {
      setLoading(false);
    }
  }

  async function activate() {
    setLoading(true);
    setError("");

    try {
      const data = await postJson(
        "/api/hub/mfa/activate",
        { code }
      );
      setRecoveryCodes(
        Array.isArray(data.recoveryCodes)
          ? data.recoveryCodes
          : []
      );
      setEnabled(true);
      setEnrollment(null);
      setCode("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not activate two-factor authentication."
      );
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    setError("");

    try {
      await postJson("/api/hub/mfa/disable", {
        currentPassword,
        code: disableCode,
      });
      setEnabled(false);
      setCurrentPassword("");
      setDisableCode("");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not disable two-factor authentication."
      );
      setLoading(false);
    }
  }

  if (recoveryCodes.length > 0) {
    return (
      <div className="hub-profile-v2-alert hub-profile-v2-alert-success">
        <CheckCircle2 size={18} />
        <div>
          <strong>
            Two-factor authentication enabled
          </strong>
          <span>
            Save these recovery codes now. Each
            code works once and will not be shown
            again.
          </span>

          <pre className="hub-settings-recovery-codes">
            {recoveryCodes.join("\n")}
          </pre>

          <button
            type="button"
            className="hub-send-button"
            onClick={() => {
              setRecoveryCodes([]);
              router.refresh();
            }}
          >
            I saved the recovery codes
            <ShieldCheck size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (enabled) {
    return (
      <div className="hub-settings-grid">
        <div className="hub-profile-v2-alert hub-profile-v2-alert-success">
          <ShieldCheck size={18} />
          <div>
            <strong>Enabled</strong>
            <span>
              A verification code is required
              after your password.
            </span>
          </div>
        </div>

        {error ? (
          <div
            className="hub-profile-v2-alert hub-profile-v2-alert-error"
            role="alert"
          >
            <ShieldOff size={18} />
            <div>
              <strong>Could not change MFA</strong>
              <span>{error}</span>
            </div>
          </div>
        ) : null}

        <label className="hub-settings-field">
          <span>Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(event.target.value)
            }
          />
        </label>

        <label className="hub-settings-field">
          <span>TOTP or recovery code</span>
          <input
            type="text"
            autoComplete="one-time-code"
            value={disableCode}
            onChange={(event) =>
              setDisableCode(event.target.value)
            }
          />
        </label>

        <div className="hub-settings-actions">
          <button
            type="button"
            className="hub-secondary-button"
            onClick={disable}
            disabled={loading}
          >
            {loading ? (
              <Loader2
                size={15}
                className="hub-login-spinner"
              />
            ) : (
              <ShieldOff size={15} />
            )}
            Disable two-factor authentication
          </button>
        </div>
      </div>
    );
  }

  if (enrollment) {
    return (
      <div className="hub-settings-grid">
        {error ? (
          <div
            className="hub-profile-v2-alert hub-profile-v2-alert-error"
            role="alert"
          >
            <ShieldOff size={18} />
            <div>
              <strong>Could not activate MFA</strong>
              <span>{error}</span>
            </div>
          </div>
        ) : null}

        <p>
          Add this secret to your authenticator
          app, then enter the current 6-digit code.
          The secret expires at{" "}
          {new Date(enrollment.expiresAt).toLocaleTimeString(
            "sv-SE"
          )}
          .
        </p>

        <div className="hub-settings-field">
          <span>Manual secret</span>
          <code>{enrollment.secret}</code>
        </div>

        <div className="hub-settings-field">
          <span>Setup URI</span>
          <code>{enrollment.otpauthUrl}</code>
        </div>

        <label className="hub-settings-field">
          <span>6-digit code</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) =>
              setCode(event.target.value)
            }
          />
        </label>

        <div className="hub-settings-actions">
          <button
            type="button"
            className="hub-send-button"
            onClick={activate}
            disabled={loading}
          >
            {loading ? (
              <Loader2
                size={15}
                className="hub-login-spinner"
              />
            ) : (
              <ShieldCheck size={15} />
            )}
            Confirm and enable
          </button>

          <button
            type="button"
            className="hub-secondary-button"
            onClick={() => {
              setEnrollment(null);
              setError("");
            }}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hub-settings-grid">
      {error ? (
        <div
          className="hub-profile-v2-alert hub-profile-v2-alert-error"
          role="alert"
        >
          <ShieldOff size={18} />
          <div>
            <strong>Could not start MFA</strong>
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      <p>
        Two-factor authentication is not enabled.
        Add an authenticator app to require a
        one-time code after your password.
      </p>

      <div className="hub-settings-actions">
        <button
          type="button"
          className="hub-send-button"
          onClick={startEnrollment}
          disabled={loading}
        >
          {loading ? (
            <Loader2
              size={15}
              className="hub-login-spinner"
            />
          ) : (
            <ShieldCheck size={15} />
          )}
          Enable two-factor authentication
        </button>
      </div>
    </div>
  );
}
