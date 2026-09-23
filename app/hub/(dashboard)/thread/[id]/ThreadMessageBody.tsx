"use client";

import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { splitQuotedMail } from "@/lib/mail-content";

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
  const [showQuoted, setShowQuoted] = useState(false);

  const { visible: main, quoted } = splitQuotedMail(body);
  const isLong = main.length > 1400 || main.split("\n").length > 22;
  const preview = isLong ? main.slice(0, 1000).trimEnd() : main;
  const visibleBody = isLong && !expanded ? preview : main;

  return (
    <div className="hub-thread-message-body">
      <div className="hub-thread-message-text">
        {formatMessageBody(visibleBody)}
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

      {quoted && (
        <div className="hub-thread-quoted-wrap">
          <button
            className="hub-thread-quoted-toggle"
            type="button"
            onClick={() => setShowQuoted((value) => !value)}
            aria-expanded={showQuoted}
            title={showQuoted ? "Hide quoted text" : "Show quoted text"}
          >
            <MoreHorizontal size={16} />
            <span>{showQuoted ? "Hide quoted text" : "Show quoted text"}</span>
          </button>

          {showQuoted && (
            <div className="hub-thread-quoted-text">
              {formatMessageBody(quoted)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
