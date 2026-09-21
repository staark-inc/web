"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/*
 * Subscribes to /api/hub/stream and refreshes the current
 * route whenever the server reports new Hub activity.
 */
export default function LiveUpdates() {
  const router = useRouter();

  useEffect(() => {
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let delay = 3000;

    function connect() {
      if (stopped) return;

      source = new EventSource("/api/hub/stream");

      source.addEventListener("ready", () => {
        delay = 3000;
      });

      source.addEventListener("update", () => {
        router.refresh();
      });

      source.onerror = () => {
        source?.close();
        source = null;

        if (stopped) return;

        /*
         * EventSource retries on its own, but only after
         * closing; backing off avoids hammering the server
         * while it is restarting.
         */
        retry = setTimeout(connect, delay);
        delay = Math.min(delay * 2, 30000);
      };
    }

    connect();

    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      source?.close();
    };
  }, [router]);

  return null;
}
