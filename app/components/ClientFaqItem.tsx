"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function ClientFaqItem({
  question,
  answer,
  index,
  className = "v2-faq-item",
}: {
  question: string;
  answer: string;
  index: number;
  className?: string;
}) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className={className}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{question}</span>
        <ChevronDown size={20} className={open ? "rotate" : ""} />
      </button>
      {open && <p>{answer}</p>}
    </div>
  );
}
