import {
  Camera,
  Mail,
  Save,
  UserRound,
} from "lucide-react";

export default function HubProfilePage() {
  return (
    <div className="hub-page hub-settings-page">
      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">STAARK HUB</span>
          <h1>Profile</h1>
          <p>Manage your personal information and email identity.</p>
        </div>
      </header>

      <section className="hub-settings-card">
        <div className="hub-settings-heading">
          <div className="hub-settings-icon">
            <UserRound size={19} />
          </div>

          <div>
            <h2>Personal information</h2>
            <p>This information identifies you inside Staark Hub.</p>
          </div>
        </div>

        <div className="hub-profile-avatar-row">
          <div className="hub-profile-avatar">IC</div>

          <button className="hub-secondary-button" type="button">
            <Camera size={16} />
            Change photo
          </button>
        </div>

        <div className="hub-settings-grid">
          <label className="hub-settings-field">
            <span>Name</span>
            <input type="text" defaultValue="Ionuț Costin" />
          </label>

          <label className="hub-settings-field">
            <span>Role</span>
            <input type="text" defaultValue="Administrator" />
          </label>

          <label className="hub-settings-field hub-settings-full">
            <span>Email</span>

            <div className="hub-input-icon">
              <Mail size={16} />
              <input
                type="email"
                defaultValue="contact@staarkinc.com"
              />
            </div>
          </label>
        </div>

        <div className="hub-settings-actions">
          <button className="hub-send-button" type="button">
            Save changes
            <Save size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}