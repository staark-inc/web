import Link from "next/link";
import { LockKeyhole, LogIn } from "lucide-react";

export default function HubLoginPage() {
  return (
    <div className="hub-login">
      <div className="hub-login-card">
        <div className="hub-login-logo">S</div>

        <div className="hub-login-heading">
          <span className="hub-eyebrow">STAARK HUB</span>
          <h1>Welcome back</h1>
          <p>Sign in to access your Staark workspace.</p>
        </div>

        <form className="hub-login-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="name@staarkinc.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Password</span>

            <div className="hub-login-password">
              <LockKeyhole size={16} />

              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </label>

          <Link href="/hub" className="hub-login-button">
            Sign in
            <LogIn size={17} />
          </Link>
        </form>

        <p className="hub-login-footer">
          Staark Inc. Internal Workspace
        </p>
      </div>
    </div>
  );
}