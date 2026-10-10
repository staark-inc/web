"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Inbox, Mail, MessageSquareText, PenLine } from "lucide-react";

export type InboxConversation = {
  id: string;
  initials: string;
  name: string;
  email: string;
  subject: string;
  preview: string;
  date: string;
  dateIso: string;
  messageCount: number;
  unread: number;
  isOther: boolean;
  needsReply: boolean;
  href: string;
};

export default function InboxWorkspace({
  conversations, selectedView,
}: {
  conversations: InboxConversation[];
  selectedView: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const [showPreviewOnMobile, setShowPreviewOnMobile] = useState(false);

  // Changing filters/search always selects a real conversation from the new list.
  const activeId = conversations.some((thread) => thread.id === selectedId)
    ? selectedId
    : conversations[0]?.id ?? null;
  const selected = conversations.find((thread) => thread.id === activeId) ?? null;

  useEffect(() => {
    setShowPreviewOnMobile(false);
  }, [selectedView]);

  return (
    <section className={`sw-mail-workspace ${showPreviewOnMobile ? "is-preview-open" : ""}`} aria-label="Mail workspace">
      <div className="sw-mail-list-panel">
        <div className="sw-mail-panel-heading">
          <div><span className="sw-eyebrow">CONVERSATIONS</span><h2>{selectedView === "inbox" ? "Your inbox" : selectedView.replaceAll("-", " ")}</h2></div>
          <span className="sw-mail-counter">{conversations.length}</span>
        </div>
        {conversations.length === 0 ? (
          <div className="sw-mail-empty"><Inbox size={23}/><strong>No conversations in this view</strong><span>Choose a different filter or search.</span></div>
        ) : (
          <div className="sw-mail-conversations" role="list" aria-label="Conversations">
            {conversations.map((thread) => (
              <div role="listitem" key={thread.id} className="sw-mail-listitem">
                <button type="button"
                  className={`sw-mail-conversation ${activeId === thread.id ? "is-selected" : ""} ${thread.unread > 0 ? "is-unread" : ""}`}
                  onClick={() => { setSelectedId(thread.id); setShowPreviewOnMobile(true); }}
                  aria-current={activeId === thread.id ? "true" : undefined}
                  aria-label={`Preview conversation with ${thread.name}: ${thread.subject}`}>
                  <span className="sw-mail-avatar">{thread.initials}</span>
                  <span className="sw-mail-conversation-content">
                    <span className="sw-mail-conversation-top"><strong>{thread.name}</strong><time dateTime={thread.dateIso}>{thread.date}</time></span>
                    <span className="sw-mail-conversation-subject">{thread.subject}</span>
                    <span className="sw-mail-conversation-snippet">{thread.preview || "No preview available"}</span>
                    <span className="sw-mail-conversation-bottom">
                      {thread.unread > 0 ? <span className="sw-mail-tag sw-mail-tag-unread">{thread.unread} unread</span>
                        : thread.isOther ? <span className="sw-mail-tag">Other</span>
                          : thread.needsReply ? <span className="sw-mail-tag sw-mail-tag-reply">Needs reply</span>
                            : <span className="sw-mail-tag sw-mail-tag-done">Replied</span>}
                      <span>{thread.messageCount} {thread.messageCount === 1 ? "message" : "messages"}</span>
                    </span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sw-mail-preview-panel">
        {selected ? (
          <>
            <header className="sw-mail-preview-header">
              <button type="button" className="sw-mail-mobile-back" onClick={() => setShowPreviewOnMobile(false)}>
                <ArrowLeft size={16}/> Inbox
              </button>
              <div className="sw-mail-preview-heading">
                <span className="sw-eyebrow">MESSAGE PREVIEW</span>
                <h2>{selected.subject}</h2>
                <p>Read the latest message, then open the conversation to reply.</p>
              </div>
              <Link className="sw-mail-open-link" href={selected.href}>Open conversation <ArrowRight size={16}/></Link>
            </header>
            <div className="sw-mail-preview-body">
              <div className="sw-mail-sender">
                <span className="sw-mail-avatar">{selected.initials}</span>
                <div><strong>{selected.name}</strong><span>{selected.email}</span></div>
                <time dateTime={selected.dateIso}>{selected.date}</time>
              </div>
              <div className="sw-mail-message-preview">
                <div className="sw-mail-preview-label"><Mail size={15}/> Latest message preview</div>
                <p>{selected.preview || "No plain-text preview is available for this message."}</p>
                <span className="sw-mail-preview-explainer">This is a shortened, text-only preview. Opening the conversation shows the complete message history and attachments.</span>
              </div>
            </div>
            <footer className="sw-mail-preview-footer">
              <span><MessageSquareText size={16}/>{selected.messageCount} messages in conversation</span>
              <Link href={selected.href}><PenLine size={16}/> View thread &amp; reply <ArrowRight size={16}/></Link>
            </footer>
          </>
        ) : (
          <div className="sw-mail-empty sw-mail-empty-preview"><Mail size={28}/><strong>Select a conversation</strong><span>The latest message will appear here.</span></div>
        )}
      </div>
    </section>
  );
}
