import { redirect } from "next/navigation";
import {
  BellDot,
  CircleDollarSign,
  FileCheck2,
  Inbox,
  LifeBuoy,
  Save,
  Target,
} from "lucide-react";

import { getSession } from "@/lib/auth";
import {
  parseNotificationPreferences,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  notifications?: string;
}>;

const items = [
  {
    key: "inbox",
    name: "notifyInbox",
    title: "New emails",
    description: "Incoming customer messages and replies imported into Inbox.",
    icon: Inbox,
  },
  {
    key: "leads",
    name: "notifyLeads",
    title: "New leads",
    description: "New enquiries and leads created from the website and CRM.",
    icon: Target,
  },
  {
    key: "offers",
    name: "notifyOffers",
    title: "Offer activity",
    description: "When a client views, accepts or declines an offer.",
    icon: FileCheck2,
  },
  {
    key: "support",
    name: "notifySupport",
    title: "Support requests",
    description: "New support tickets submitted by customers.",
    icon: LifeBuoy,
  },
  {
    key: "billing",
    name: "notifyBilling",
    title: "Billing events",
    description: "Payment and invoice alerts once Billing sync is connected.",
    icon: CircleDollarSign,
  },
] as const;

export default async function NotificationPreferencesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/hub/login");
  }

  const [params, user] = await Promise.all([
    searchParams,
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        notificationPreferences: true,
      },
    }),
  ]);

  if (!user) {
    redirect("/hub/login");
  }

  const preferences = parseNotificationPreferences(
    user.notificationPreferences
  );

  return (
    <div className="hub-page hub-notification-preferences-page">
      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">PROFILE</span>
          <h1>Notifications</h1>
          <p>
            Choose which Hub activity should create persistent notifications for your account.
          </p>
        </div>
      </header>

      {params.notifications === "1" ? (
        <div className="hub-profile-v2-alert hub-profile-v2-alert-success">
          <BellDot size={17} />
          <div>
            <strong>Notification preferences saved</strong>
            <span>Your choices are now active across Staark Hub.</span>
          </div>
        </div>
      ) : null}

      <section className="hub-notification-preferences-card">
        <div className="hub-notification-preferences-head">
          <div className="hub-notification-preferences-head-icon">
            <BellDot size={19} />
          </div>
          <div>
            <h2>Activity notifications</h2>
            <p>
              These settings control what appears in the Hub notification center.
            </p>
          </div>
        </div>

        <form action="/api/hub/profile" method="post">
          <input type="hidden" name="action" value="notifications" />
          <input
            type="hidden"
            name="redirect"
            value="/hub/profile/notifications"
          />

          <div className="hub-notification-preferences-list">
            {items.map((item) => {
              const Icon = item.icon;
              const checked = preferences[item.key];

              return (
                <label
                  key={item.key}
                  className="hub-notification-preference-row"
                >
                  <span className="hub-notification-preference-icon">
                    <Icon size={17} />
                  </span>

                  <span className="hub-notification-preference-copy">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>

                  <span className="hub-notification-switch">
                    <input
                      type="checkbox"
                      name={item.name}
                      defaultChecked={checked}
                    />
                    <span aria-hidden="true" />
                  </span>
                </label>
              );
            })}
          </div>

          <div className="hub-notification-preferences-footer">
            <div>
              <strong>Persistent by design</strong>
              <span>
                Disabled categories stop creating new notifications; existing history stays intact.
              </span>
            </div>

            <button type="submit" className="hub-send-button">
              Save notification settings
              <Save size={16} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
