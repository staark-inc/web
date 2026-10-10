"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Bell, BellRing, Check, CheckCheck, CircleDollarSign, FileCheck2, Inbox, LifeBuoy, LoaderCircle, RefreshCw, Settings2, Target, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

export type NotificationItem = {
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
  if (type.startsWith("lead.")) return <Target size={18} />;
  if (type.startsWith("inbox.")) return <Inbox size={18} />;
  if (type.startsWith("offer.")) return <FileCheck2 size={18} />;
  if (type.startsWith("support.")) return <LifeBuoy size={18} />;
  if (type.startsWith("billing.")) return <CircleDollarSign size={18} />;
  return <Bell size={18} />;
}

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (!Number.isFinite(minutes)) return "";
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationCenter({ initialNotifications, initialUnread }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const mutationRef = useRef(false);
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const dialogId = useId();

  const visibleNotifications = useMemo(() => [...notifications]
    .filter((item) => filter === "all" || !item.readAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [notifications, filter]);

  const refreshNotifications = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setRefreshing(true);
    try {
      const response = await fetch("/api/hub/notifications", { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Unable to refresh");
      const data = await response.json() as { notifications: NotificationItem[]; unread: number };
      if (!Array.isArray(data.notifications) || typeof data.unread !== "number") throw new Error("Invalid response");
      if (controller.signal.aborted) return;
      setNotifications(data.notifications);
      setUnread(Math.max(0, data.unread));
      setError(null);
    } catch {
      if (!controller.signal.aborted) setError("Could not refresh notifications. Your previous activity is still shown.");
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const onRealtime = () => {
      if (!mutationRef.current) void refreshNotifications();
    };
    window.addEventListener("hub:realtime-update", onRealtime);
    return () => {
      window.removeEventListener("hub:realtime-update", onRealtime);
      requestRef.current?.abort();
    };
  }, [refreshNotifications]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    const oldOverflow = document.body.style.overflow;
    dialog?.showModal();
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = oldOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  useEffect(() => {
    if (previousPath.current !== pathname) dialogRef.current?.close();
    previousPath.current = pathname;
  }, [pathname]);

  async function markRead(id?: string) {
    if (mutationRef.current || (id ? !notifications.some((item) => item.id === id && !item.readAt) : unread === 0)) return;
    mutationRef.current = true;
    requestRef.current?.abort();
    setRefreshing(false);
    setPending(id ?? "all");
    setError(null);
    try {
      const response = await fetch("/api/hub/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { action: "read", id } : { action: "read-all" }),
      });
      if (!response.ok) throw new Error("Unable to save");
      const now = new Date().toISOString();
      setNotifications((current) => current.map((item) => !id || item.id === id ? { ...item, readAt: item.readAt ?? now } : item));
      setUnread((current) => id ? Math.max(0, current - 1) : 0);
      // Reconcile counts that include notifications outside the recent list.
      await refreshNotifications();
    } catch {
      setError("Could not mark notifications as read. Please try again.");
    } finally {
      mutationRef.current = false;
      setPending(null);
    }
  }

  return (
    <div className="hub-notification-center">
      <button ref={triggerRef} type="button"
        className={`hub-notification-trigger hub-compact-tooltip ${unread > 0 ? "has-unread" : ""}`}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? dialogId : undefined}
        title="Notifications" data-tooltip="Notifications" onClick={() => { setOpen(true); void refreshNotifications(); }}>
        <Bell size={18} />
        <span className="hub-notification-trigger-label">Notifications</span>
        {unread > 0 && <span className="hub-notification-badge" aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && createPortal(
        <dialog ref={dialogRef} id={dialogId} className="hub-notification-dialog"
          aria-labelledby={`${dialogId}-title`} onClose={(event) => { if (!event.currentTarget.open) setOpen(false); }}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]");
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
          }}>
          <div className="hub-notification-panel-head">
            <div className="hub-notification-panel-title">
              <span className="hub-notification-panel-title-icon"><BellRing size={21} /></span>
              <div><h2 id={`${dialogId}-title`}>Notifications</h2><p>Your workspace activity, in one place.</p></div>
            </div>
            <button ref={closeRef} type="button" className="hub-notification-icon-button" aria-label="Close notifications" onClick={() => dialogRef.current?.close()}><X size={19} /></button>
          </div>

          <div className="hub-notification-panel-actions">
            <div className="hub-notification-filters" role="group" aria-label="Filter notifications">
              <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All activity</button>
              <button type="button" aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>Unread <span>{unread}</span></button>
            </div>
            <button type="button" className="hub-notification-icon-button" aria-label="Refresh notifications" disabled={refreshing || pending !== null} onClick={() => void refreshNotifications()}>
              <RefreshCw size={17} className={refreshing ? "hub-notification-spin" : undefined} />
            </button>
          </div>

          {error && <div className="hub-notification-error" role="alert">{error}</div>}
          <div className="hub-notification-list" aria-busy={refreshing}>
            {visibleNotifications.length === 0 ? (
              <div className="hub-notification-empty">
                <span className="hub-notification-empty-icon"><CheckCheck size={28} /></span>
                <strong>{filter === "unread" ? "You're all caught up" : "No activity yet"}</strong>
                <p>{filter === "unread" ? "No unread notifications in your recent activity." : "New leads, messages and project activity will appear here."}</p>
              </div>
            ) : visibleNotifications.map((item) => (
              <article className={`hub-notification-item ${!item.readAt ? "is-unread" : ""}`} key={item.id}>
                <span className={`hub-notification-item-icon hub-notification-kind-${item.type.split(".")[0]}`}>{iconFor(item.type)}</span>
                <div className="hub-notification-item-copy">
                  <div className="hub-notification-item-meta"><span>{item.type.split(".")[0]}</span><time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time></div>
                  {item.href ? (
                    <Link href={item.href} className="hub-notification-item-link" onClick={() => {
                      if (!item.readAt) void markRead(item.id);
                      dialogRef.current?.close();
                    }}>{item.title}</Link>
                  ) : <strong>{item.title}</strong>}
                  {item.message && <p>{item.message}</p>}
                </div>
                {!item.readAt ? (
                  <button type="button" className="hub-notification-mark-read" aria-label={`Mark as read: ${item.title}`} title="Mark as read" disabled={pending !== null} onClick={() => void markRead(item.id)}>
                    {pending === item.id ? <LoaderCircle size={15} className="hub-notification-spin" /> : <span className="hub-notification-unread-dot" />}
                  </button>
                ) : <Check className="hub-notification-read-check" size={16} aria-label="Read" />}
              </article>
            ))}
          </div>
          <footer className="hub-notification-panel-footer">
            <button type="button" className="hub-notification-read-all" onClick={() => void markRead()} disabled={unread === 0 || pending !== null}>
              {pending === "all" ? <LoaderCircle size={17} className="hub-notification-spin" /> : <CheckCheck size={17} />} Mark all as read
            </button>
            <Link href="/hub/profile/notifications" className="hub-notification-preferences-link" onClick={() => dialogRef.current?.close()}><Settings2 size={16} />Settings</Link>
          </footer>
        </dialog>, document.body,
      )}
    </div>
  );
}
