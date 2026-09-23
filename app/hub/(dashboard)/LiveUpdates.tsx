"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
        window.dispatchEvent(
          new CustomEvent("hub:realtime-ready")
        );
      });

      source.addEventListener("update", (event) => {
        let detail: unknown = null;

        try {
          detail = JSON.parse(
            (event as MessageEvent<string>).data
          );
        } catch {
          detail = null;
        }

        window.dispatchEvent(
          new CustomEvent("hub:realtime-update", {
            detail,
          })
        );

        router.refresh();
      });

      source.onerror = () => {
        source?.close();
        source = null;

        window.dispatchEvent(
          new CustomEvent("hub:realtime-disconnected")
        );

        if (stopped) return;

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
