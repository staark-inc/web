import {
  Inbox,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";

const demoEmails = [
  {
    id: 1,
    name: "Anna Andersson",
    email: "anna@foretag.se",
    subject: "Ny hemsida för vårt företag",
    preview:
      "Hej! Vi driver ett mindre företag och skulle vilja få hjälp med en ny hemsida...",
    time: "14:32",
    unread: true,
  },
  {
    id: 2,
    name: "Erik Svensson",
    email: "erik@svenssonbygg.se",
    subject: "Prisförfrågan – webbdesign",
    preview:
      "Hej Staark! Jag hittade er via Google och undrar vad en ny företagssida skulle kosta...",
    time: "11:08",
    unread: true,
  },
  {
    id: 3,
    name: "Johan Karlsson",
    email: "johan@jkservice.se",
    subject: "SEO för vårt företag",
    preview:
      "Vi vill synas bättre på Google i Jönköping och skulle gärna vilja veta mer om hur ni arbetar...",
    time: "Igår",
    unread: true,
  },
  {
    id: 4,
    name: "Maria Nilsson",
    email: "maria@nilsson.se",
    subject: "Tack för hjälpen!",
    preview:
      "Ville bara säga tack för ett riktigt bra arbete med vår nya webbplats...",
    time: "16 sep",
    unread: false,
  },
];

export default function HubInboxPage() {
  return (
    <div className="hub-page">
      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">STAARK HUB</span>
          <h1>Inbox</h1>
          <p>Messages and enquiries from your customers.</p>
        </div>

        <button
          type="button"
          className="hub-secondary-button"
          aria-label="Refresh inbox"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <div className="hub-toolbar">
        <div className="hub-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Search messages..."
            aria-label="Search messages"
          />
        </div>

        <div className="hub-inbox-total">
          <Inbox size={16} />
          <span>{demoEmails.length} messages</span>
        </div>
      </div>

      <section className="hub-mail-list">
        {demoEmails.map((mail) => (
          <button
            className={`hub-mail-row ${
              mail.unread ? "hub-mail-unread" : ""
            }`}
            key={mail.id}
            type="button"
          >
            <div className="hub-mail-status">
              {mail.unread && <span className="hub-unread-dot" />}

              <Star size={17} />
            </div>

            <div className="hub-mail-sender">
              <strong>{mail.name}</strong>
              <span>{mail.email}</span>
            </div>

            <div className="hub-mail-body">
              <strong>{mail.subject}</strong>
              <span>{mail.preview}</span>
            </div>

            <time>{mail.time}</time>
          </button>
        ))}
      </section>
    </div>
  );
}