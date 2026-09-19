import {
  Mail,
  Save,
  Send,
} from "lucide-react";

export default function HubSettingsPage() {
  return (
    <div className="hub-page hub-settings-page">
      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">STAARK HUB</span>
          <h1>Settings</h1>
          <p>Configure how Staark Hub handles your email.</p>
        </div>
      </header>

      <section className="hub-settings-card">
        <div className="hub-settings-heading">
          <div className="hub-settings-icon">
            <Mail size={19} />
          </div>

          <div>
            <h2>Email</h2>
            <p>Default settings for outgoing messages.</p>
          </div>
        </div>

        <div className="hub-settings-grid">
          <label className="hub-settings-field">
            <span>Sender name</span>
            <input
              type="text"
              defaultValue="Staark Inc."
            />
          </label>

          <label className="hub-settings-field">
            <span>Sender email</span>
            <input
              type="email"
              defaultValue="contact@staarkinc.com"
            />
          </label>

          <label className="hub-settings-field hub-settings-full">
            <span>Email signature</span>

            <textarea
              rows={5}
              defaultValue={`Med vänliga hälsningar,

Ionuț
Staark Inc.
staarkinc.com`}
            />
          </label>
        </div>
      </section>

      <section className="hub-settings-card">
        <div className="hub-settings-heading">
          <div className="hub-settings-icon">
            <Send size={19} />
          </div>

          <div>
            <h2>Template</h2>
            <p>Choose the default template for outgoing email.</p>
          </div>
        </div>

        <label className="hub-settings-field">
          <span>Default template</span>

          <select defaultValue="staark-standard">
            <option value="staark-standard">
              Staark Standard
            </option>
          </select>
        </label>

        <div className="hub-settings-actions">
          <button className="hub-send-button" type="button">
            Save settings
            <Save size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}