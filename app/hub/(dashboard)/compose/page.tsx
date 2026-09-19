import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function HubComposePage() {
  return (
    <div className="hub-page hub-compose-page">
      <header className="hub-page-header">
        <div>
          <Link href="/hub" className="hub-back">
            <ArrowLeft size={16} />
            Inbox
          </Link>

          <h1>New message</h1>
          <p>Send an email using the Staark template.</p>
        </div>
      </header>

      <div className="hub-compose-card">
        <div className="hub-compose-field">
          <label htmlFor="hub-to">To</label>

          <input
            id="hub-to"
            name="to"
            type="email"
            placeholder="customer@company.se"
          />
        </div>

        <div className="hub-compose-field">
          <label htmlFor="hub-subject">Subject</label>

          <input
            id="hub-subject"
            name="subject"
            type="text"
            placeholder="Subject..."
          />
        </div>

        <div className="hub-compose-field hub-compose-message">
          <label htmlFor="hub-message">Message</label>

          <textarea
            id="hub-message"
            name="message"
            rows={12}
            placeholder="Write your message..."
          />
        </div>

        <div className="hub-compose-footer">
          <div>
            <span className="hub-template-label">EMAIL TEMPLATE</span>
            <strong>Staark Standard</strong>
          </div>

          <button className="hub-send-button" type="button">
            Send message
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}