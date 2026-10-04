"use client";
import { useState } from "react";
export default function NewsAction({
  id,
  action,
  title,
}: {
  id: string;
  action: "publish" | "unpublish" | "delete";
  title: string;
}) {
  const [busy, setBusy] = useState(false);
  const label =
    action === "publish"
      ? "Publish"
      : action === "unpublish"
        ? "Unpublish"
        : "Delete";
  return (
    <form
      action="/api/hub/updates"
      method="post"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `${label} “${title}”?${action === "publish" ? " This update will become visible to its selected audience." : ""}`,
          )
        )
          event.preventDefault();
        else setBusy(true);
      }}
    >
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="id" value={id} />
      <button
        disabled={busy}
        className={
          action === "delete"
            ? "hub-updates-delete"
            : `hub-updates-button hub-updates-button-${action}`
        }
      >
        {busy ? "Working…" : label}
      </button>
    </form>
  );
}
