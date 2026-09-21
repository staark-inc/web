"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

type Props = {
  slug: string;
  action: () => Promise<void>;
};

export default function DemoDeleteButton({
  slug,
  action,
}: Props) {
  const [pending, startTransition] = useTransition();

  function remove() {
    const confirmed = window.confirm(
      `Delete demo "${slug}"?\n\nThis removes the demo container and its project configuration.`
    );

    if (!confirmed) return;

    startTransition(() => {
      void action();
    });
  }

  return (
    <button
      type="button"
      className="hub-demo-delete-button"
      onClick={remove}
      disabled={pending}
    >
      <Trash2 size={14} />
      {pending ? "Deleting..." : "Delete demo"}
    </button>
  );
}
