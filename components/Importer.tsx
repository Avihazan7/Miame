function IgIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.2 3c.32 2.06 1.62 3.66 3.8 3.9v2.66c-1.3.02-2.53-.38-3.8-1.13v6.2c0 3.06-2.45 5.37-5.4 5.37-2.96 0-5.4-2.31-5.4-5.37 0-3.05 2.44-5.36 5.4-5.36.32 0 .63.03.95.09v2.74c-.3-.1-.62-.16-.95-.16-1.45 0-2.66 1.22-2.66 2.69 0 1.47 1.21 2.69 2.66 2.69 1.46 0 2.67-1.22 2.67-2.69V3h2.73z" />
    </svg>
  );
}

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/miadynamics", Icon: IgIcon },
  { label: "TikTok", href: "https://www.tiktok.com/@miadynamicsusa", Icon: TikTokIcon }
];

export default function Importer() {
  return (
    <section className="importer-band" aria-label="היבואן הרשמי">
      <div className="wrap importer-inner">
        <div className="importer-info">
          <div className="importer-kicker">יבואן רשמי · הסוכנות המרכזית</div>
          <h3 className="importer-name">MEU · Mayer Electric Utilities</h3>
          <div className="importer-sub">יבואן MIA Dynamics ישראל · MIA FOUR</div>
          <div className="importer-meta">📍 אליעזר קפלן 21, תל אביב · מתחם דה וינצ׳י</div>
          <div className="importer-actions">
            <a className="imp-btn" href="tel:0778038321">077-8038321</a>
            <a
              className="imp-btn"
              href="https://www.miafour.co.il/"
              target="_blank"
              rel="noopener noreferrer"
            >
              🌐 miafour.co.il
            </a>
          </div>
          <div className="importer-social">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                className="imp-soc"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
              >
                <Icon />
                {label}
              </a>
            ))}
          </div>
        </div>

        <a
          className="importer-brand"
          href="https://miadynamics.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="MIA Dynamics · אתר עולמי"
        >
          <span className="imp-logo-tile">
            <img src="/mia-dynamics-logo.webp" alt="MIA Dynamics · Make it anywhere" loading="lazy" />
          </span>
          <span className="imp-global">אתר עולמי · miadynamics.com ←</span>
        </a>
      </div>
    </section>
  );
}
