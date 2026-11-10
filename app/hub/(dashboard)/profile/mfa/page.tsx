import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import {
  PageHeader,
  WorkspacePage,
} from "@/components/hub/workspace";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import MfaSettings from "./MfaSettings";

export const dynamic = "force-dynamic";

export default async function HubMfaSettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/hub/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      mfaEnabled: true,
    },
  });

  if (!user) {
    redirect("/hub/login");
  }

  return (
    <WorkspacePage className="hub-profile-v2-page sw-detail-page">
      <PageHeader
        eyebrow="STAARK HUB"
        title="Two-factor authentication"
        description="Protect your Hub account with an authenticator app and one-time recovery codes."
      />

      <div className="hub-settings-actions">
        <Link
          href="/hub/profile"
          className="hub-secondary-button"
        >
          <ArrowLeft size={15} />
          Back to profile
        </Link>
      </div>

      <section className="hub-profile-v2-card sw-card sw-card-panel sw-detail-panel">
        <div className="hub-profile-v2-card-head sw-detail-panel-head">
          <div className="hub-profile-v2-card-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2>Authenticator app</h2>
            <p>
              Use a TOTP code from 1Password,
              Google Authenticator, Microsoft
              Authenticator or a compatible app.
            </p>
          </div>
        </div>

        <div className="hub-profile-v2-card-body">
          <MfaSettings
            enabled={user.mfaEnabled}
          />
        </div>
      </section>
    </WorkspacePage>
  );
}
