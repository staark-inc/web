import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { getSession } from "@/lib/auth";
import {
  MFA_COOKIE,
  verifyMfaChallengeToken,
} from "@/lib/mfa-challenge";

import MfaVerifyForm from "./MfaVerifyForm";

export const dynamic = "force-dynamic";

export default async function HubMfaPage() {
  const session = await getSession();

  if (session) {
    redirect("/hub");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(
    MFA_COOKIE
  )?.value;

  const challenge = token
    ? await verifyMfaChallengeToken(token)
    : null;

  if (!challenge) {
    redirect("/hub/login?mfa=expired");
  }

  return (
    <div className="hub-login-page">
      <div className="hub-login-container">
        <div className="hub-login-brand">
          <div className="hub-login-logo">
            <ShieldCheck size={22} />
          </div>

          <div>
            <strong>Staark</strong>
            <span>Hub</span>
          </div>
        </div>

        <div className="hub-login-card">
          <div className="hub-login-heading">
            <h1>Two-factor verification</h1>

            <p>
              Enter the 6-digit code from your
              authenticator app, or use one of
              your recovery codes.
            </p>
          </div>

          <MfaVerifyForm />
        </div>

        <p className="hub-login-footer">
          Staark Inc. c 2026
        </p>
      </div>
    </div>
  );
}
