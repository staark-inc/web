"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function StandaloneFaqItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="faq-item">
      <button onClick={() => setOpen(!open)}>
        <span>{question}</span>
        <ChevronDown className={open ? "rotate" : ""} size={18} />
      </button>
      {open && <p>{answer}</p>}
    </div>
  );
}
