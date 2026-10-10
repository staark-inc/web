"use client";

import { Menu, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

export default function HubSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <aside className={`hub-sidebar ${open ? "is-menu-open" : ""}`}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a[href]")) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}>
      <button ref={toggle} type="button" className="hub-mobile-menu-toggle"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open} aria-controls="hub-navigation"
        onClick={() => setOpen((current) => !current)}>
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      {children}
    </aside>
  );
}
