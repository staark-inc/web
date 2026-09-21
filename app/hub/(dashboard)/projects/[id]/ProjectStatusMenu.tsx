"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { setProjectStatus } from "../actions";

type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "WAITING_CLIENT"
  | "REVIEW"
  | "COMPLETED"
  | "MAINTENANCE"
  | "CANCELLED";

type ProjectStatusMenuProps = {
  projectId: string;
  status: ProjectStatus;
};

const options: { value: ProjectStatus; label: string }[] = [
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_CLIENT", label: "Waiting on client" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function ProjectStatusMenu({
  projectId,
  status,
}: ProjectStatusMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const current = options.find((option) => option.value === status);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="hub-stage" ref={wrapperRef}>
      <button
        type="button"
        className={`hub-stage-button hub-project-status-${status.toLowerCase()}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{current?.label ?? "Planning"}</span>
        <ChevronDown size={15} />
      </button>

      {open && (
        <div className="hub-stage-menu" role="menu" aria-label="Project status">
          {options.map((option) => (
            <form
              key={option.value}
              action={setProjectStatus}
              onSubmit={() => setOpen(false)}
            >
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="status" value={option.value} />

              <button
                type="submit"
                role="menuitem"
                className={
                  option.value === status ? "hub-stage-menu-active" : ""
                }
              >
                {option.label}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
