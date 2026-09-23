"use client";

import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  CircleDollarSign,
  FileCheck2,
  Inbox,
  LifeBuoy,
  Target,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationCenterProps = {
  initialNotifications: NotificationItem[];
  initialUnread: number;
};

function iconFor(type: string) {
  if (type.startsWith("lead.")) return <Target size={15} />;
  if (type.startsWith("inbox.")) return <Inbox size={15} />;
  if (type.startsWith("offer.")) return <FileCheck2 size={15} />;
  if (type.startsWith("support.")) return <LifeBuoy size={15} />;
  if (type.startsWith("billing.")) return <CircleDollarSign size={15} />;
  return <Bell size={15} />;
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function NotificationCenter({
  initialNotifications,
  initialUnread,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);

  const hasUnread = unread > 0;

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      ),
    [notifications]
  );

  async function refreshNotifications() {
    try {
      const response = await fetch("/api/hub/notifications", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json()) as {
        notifications?: NotificationItem[];
        unread?: number;
      };

      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // Keep the existing list when realtime refresh is temporarily unavailable.
    }
  }

  useEffect(() => {
    const handleRealtime = () => {
      void refreshNotifications();
    };

    window.addEventListener("hub:realtime-update", handleRealtime);

    return () => {
      window.removeEventListener("hub:realtime-update", handleRealtime);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    void refreshNotifications();
  }, [open]);

  async function markRead(id: string) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id && !item.readAt
          ? { ...item, readAt: new Date().toISOString() }
          : item
      )
    );
    setUnread((current) => Math.max(0, current - 1));

    await fetch("/api/hub/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "read",
        id,
      }),
    }).catch(() => null);
  }

  async function markAllRead() {
    if (!hasUnread || loading) return;

    setLoading(true);
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      }))
    );
    setUnread(0);

    await fetch("/api/hub/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "read-all",
      }),
    }).catch(() => null);

    setLoading(false);
  }

  return (
    <div className="hub-notification-center">
      <button
        type="button"
        className={`hub-notification-trigger ${hasUnread ? "has-unread" : ""}`}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={17} />
        <span className="hub-notification-trigger-label">Notifications</span>
        {hasUnread ? (
          <span className="hub-notification-badge">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="hub-notification-panel">
          <div className="hub-notification-panel-head">
            <div className="hub-notification-panel-title">
              <div className="hub-notification-panel-title-icon">
                <Bell size={16} />
              </div>
              <div>
                <strong>Notifications</strong>
                <span>Recent activity across your Hub</span>
              </div>
            </div>

            <button
              type="button"
              className="hub-notification-close"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
            >
              <X size={15} />
            </button>
          </div>

          <div className="hub-notification-panel-actions">
            <div className="hub-notification-status">
              <span className={`hub-notification-status-dot ${hasUnread ? "is-live" : ""}`} />
              <span>
                {unread === 0
                  ? "All caught up"
                  : `${unread} unread notification${unread === 1 ? "" : "s"}`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={!hasUnread || loading}
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          </div>

          <div className="hub-notification-list">
            {sortedNotifications.length === 0 ? (
              <div className="hub-notification-empty">
                <div className="hub-notification-empty-icon">
                  <Bell size={21} />
                </div>
                <strong>Nothing needs your attention</strong>
                <span>
                  New leads, messages, offers, support and billing activity will show up here.
                </span>
              </div>
            ) : (
              sortedNotifications.map((item) => {
                const content = (
                  <>
                    <div className="hub-notification-item-icon">
                      {iconFor(item.type)}
                    </div>
                    <div className="hub-notification-item-copy">
                      <div className="hub-notification-item-title-row">
                        <strong>{item.title}</strong>
                        <span>{relativeTime(item.createdAt)}</span>
                      </div>
                      {item.message ? <p>{item.message}</p> : null}
                    </div>
                    {!item.readAt ? (
                      <span className="hub-notification-unread-dot" />
                    ) : (
                      <Check className="hub-notification-read-check" size={13} />
                    )}
                  </>
                );

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`hub-notification-item ${!item.readAt ? "is-unread" : ""}`}
                      onClick={() => {
                        if (!item.readAt) void markRead(item.id);
                        setOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`hub-notification-item ${!item.readAt ? "is-unread" : ""}`}
                    onClick={() => {
                      if (!item.readAt) void markRead(item.id);
                    }}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
