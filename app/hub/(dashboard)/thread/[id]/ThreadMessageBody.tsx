"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function formatMessageBody(value: string) {
  const pattern = /<(https?:\/\/[^\s>]+)>|(https?:\/\/[^\s<>]+)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(value)) !== null) {
    const [full, wrappedUrl, bareUrl] = match;
    const url = wrappedUrl ?? bareUrl;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(value.slice(lastIndex, start));
    }

    let text = url;
    try {
      text = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      text = url;
    }

    nodes.push(
      <a key={key++} href={url} title={url} target="_blank" rel="noopener noreferrer">
        {text}
      </a>
    );

    lastIndex = match.index + full.length;
  }

  nodes.push(value.slice(lastIndex));
  return nodes;
}

export default function ThreadMessageBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const normalizedBody = body.replace(/\r\n?/g, "\n");
  const isLong = normalizedBody.length > 1400 || normalizedBody.split("\n").length > 22;
  const preview = isLong ? normalizedBody.slice(0, 1000).trimEnd() : normalizedBody;
  const visibleBody = isLong && !expanded ? preview : normalizedBody;

  return (
    <div className="hub-thread-message-body">
      <div className="hub-thread-message-text">
        {hydrated ? formatMessageBody(visibleBody) : visibleBody}
        {isLong && !expanded ? "…" : null}
      </div>
      {isLong && (
        <button
          className="hub-thread-expand"
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? "Show less" : "Show full message"}
        </button>
      )}
    </div>
  );
}
