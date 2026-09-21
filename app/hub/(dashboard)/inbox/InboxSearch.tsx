"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type InboxSearchProps = {
  initialQuery: string;
};

export default function InboxSearch({
  initialQuery,
}: InboxSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef(initialQuery);

  useEffect(() => {
    const trimmed = value.trim();

    if (trimmed === latest.current) {
      return;
    }

    const timer = setTimeout(() => {
      latest.current = trimmed;

      startTransition(() => {
        router.replace(
          trimmed
            ? `/hub/inbox?q=${encodeURIComponent(trimmed)}`
            : "/hub/inbox",
          { scroll: false }
        );
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [value, router]);

  function clear() {
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <div
      className="hub-search"
      data-pending={isPending ? "true" : undefined}
    >
      <Search size={17} />

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search conversations..."
        aria-label="Search conversations"
      />

      {value && (
        <button
          type="button"
          onClick={clear}
          className="hub-search-clear"
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
