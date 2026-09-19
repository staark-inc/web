"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        "/api/hub/logout",
        {
          method: "POST",
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        throw new Error("Could not sign out.");
      }

      window.location.assign("/hub/login");
    } catch (error) {
      console.error(
        "Hub sign out failed:",
        error
      );

      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="hub-icon-button"
      aria-label="Sign out"
      title="Sign out"
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut size={17} />
    </button>
  );
}