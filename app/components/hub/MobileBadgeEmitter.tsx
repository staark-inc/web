"use client";

import { useEffect } from "react";

type MobileBadgeEmitterProps = {
  inboxCount: number;
  leadsCount: number;
};

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export function MobileBadgeEmitter({
  inboxCount,
  leadsCount,
}: MobileBadgeEmitterProps) {
  useEffect(() => {
    const bridge =
      window.ReactNativeWebView;

    if (!bridge) {
      return;
    }

    bridge.postMessage(
      JSON.stringify({
        type: "STAARK_UNREAD_COUNT",
        count: inboxCount,
      })
    );

    bridge.postMessage(
      JSON.stringify({
        type: "STAARK_LEAD_COUNT",
        count: leadsCount,
      })
    );
  }, [
    inboxCount,
    leadsCount,
  ]);

  return null;
}