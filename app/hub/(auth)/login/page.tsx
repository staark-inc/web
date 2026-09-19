import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function HubLoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/hub");
  }

  return (
    <div className="hub-login-page">
      <div className="hub-login-container">
        <div className="hub-login-brand">
          <div className="hub-login-logo">
            <Sparkles size={22} />
          </div>

          <div>
            <strong>Staark</strong>
            <span>Hub</span>
          </div>
        </div>

        <div className="hub-login-card">
          <div className="hub-login-heading">
            <h1>Welcome back</h1>

            <p>
              Sign in to manage messages and
              communication for Staark Inc.
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="hub-login-footer">
          Staark Inc. © 2026
        </p>
      </div>
    </div>
  );
}