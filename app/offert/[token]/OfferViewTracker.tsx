"use client";

import { useEffect } from "react";

export default function OfferViewTracker({
  token,
}: {
  token: string;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch(
        `/api/offert/${encodeURIComponent(token)}/view`,
        {
          method: "POST",
          keepalive: true,
        }
      );
    }, 750);

    return () => {
      window.clearTimeout(timer);
    };
  }, [token]);

  return null;
}
