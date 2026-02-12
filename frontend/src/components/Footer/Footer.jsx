import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        {/* ===== BRAND / ABOUT ===== */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img
              src="/Images/logo.png"
              alt="TaxTim Logo"
              className="footer-logo-img"
            />
          </div>

          <p className="footer-about-text">
            TaxTim is South Africa’s leading online tax assistant, trusted by hundreds
    of thousands of taxpayers. Our platform now includes a powerful{" "}
    <strong>Crypto Capital Gains Tax Calculator</strong> designed to handle
    complex crypto activity with accuracy and ease.
          </p>

          <p className="footer-about-text">
    Whether you trade, invest, swap, or move crypto between wallets, TaxTim
    helps you calculate gains correctly, apply FIFO rules, and stay fully
    compliant with SARS — without spreadsheets or guesswork.
  </p>

          <a
            href="https://taxtim.com"
            target="_blank"
            rel="noreferrer"
            className="footer-cta-btn"
          >
            Visit TaxTim
          </a>
        </div>

        {/* ===== ABOUT TAXTIM ===== */}
        <div className="footer-column">
          <h4>About TaxTim</h4>
           <p>
    Founded in South Africa, TaxTim combines registered tax practitioners with
    intelligent automation to guide users through tax season confidently and
    correctly.
  </p>
  <p>
    Our Crypto Calculator extends this expertise to digital assets, translating
    complex transaction histories into clear, SARS-ready tax outcomes.
  </p>
        </div>

        {/* ===== MY ACCOUNT ===== */}
        <div className="footer-column">
          <h4>My Account</h4>
          <p>
    Your TaxTim account securely stores your tax information, uploaded
    documents, and calculated results in one place.
  </p>
  <p>
    Crypto calculations, FIFO lot breakdowns, and transaction summaries remain
    accessible and auditable — giving you confidence in every figure submitted.
  </p>
        </div>

        {/* ===== RESOURCES ===== */}
        <div className="footer-column">
          <h4>Resources</h4>
          <p>
    TaxTim provides practical tools and educational guidance to help users
    understand tax implications before they submit.
  </p>
  <p>
    The Crypto Calculator works hand-in-hand with these resources to explain how
    gains are calculated and why each result matters for your return.
  </p>
        </div>

        {/* ===== COMPANY ===== */}
        <div className="footer-column">
          <h4>Company</h4>
          <p>
    TaxTim is operated by Human Robot Pty Ltd and supported by SARS-registered
    tax practitioners.
  </p>
  <p>
    Our mission is to simplify tax through technology — delivering powerful,
    compliant tools like the Crypto Calculator that make even complex tax
    scenarios manageable.
  </p>
        </div>
      </div>

      {/* ===== BOTTOM SECTION / BORDER ===== */}
      <hr className="footer-divider" />

      {/* ===== SOCIAL MEDIA ICONS BELOW DIVIDER (centered, original colors) ===== */}
      <div className="footer-socials-bottom">
        <a
          href="https://twitter.com/taxtim"
          target="_blank"
          rel="noreferrer"
          aria-label="TaxTim Twitter"
        >
          <img
            className="social-icon"
            src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitter.svg"
            alt="Twitter"
            style={{ filter: "invert(29%) sepia(95%) saturate(4557%) hue-rotate(178deg) brightness(98%) contrast(101%)" }}
          />
        </a>
        <a
          href="https://web.facebook.com/taxtim.za/?_rdc=1&_rdr#"
          target="_blank"
          rel="noreferrer"
          aria-label="TaxTim Facebook"
        >
          <img
            className="social-icon"
            src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg"
            alt="Facebook"
            style={{ filter: "invert(29%) sepia(92%) saturate(3485%) hue-rotate(204deg) brightness(97%) contrast(101%)" }}
          />
        </a>
        <a
          href="https://www.instagram.com/taxtim_za/reel/C7EItivN-26/"
          target="_blank"
          rel="noreferrer"
          aria-label="TaxTim Instagram"
        >
          <img
            className="social-icon"
            src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg"
            alt="Instagram"
            style={{ filter: "invert(39%) sepia(78%) saturate(5250%) hue-rotate(321deg) brightness(94%) contrast(101%)" }}
          />
        </a>
        <a
          href="https://www.linkedin.com/company/taxtim/"
          target="_blank"
          rel="noreferrer"
          aria-label="TaxTim LinkedIn"
        >
          <img
            className="social-icon"
            src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg"
            alt="LinkedIn"
            style={{ filter: "invert(28%) sepia(100%) saturate(2300%) hue-rotate(188deg) brightness(96%) contrast(101%)" }}
          />
        </a>
      </div>

      {/* ===== TERMS + COPYRIGHT ===== */}
      <div className="footer-bottom">
        <p className="footer-terms">
          By using TaxTim, you agree to our Terms of Service and Privacy Policy.
          All content and calculations are for informational purposes only and
          do not constitute financial advice.
        </p>

        <p className="footer-copy">
          © {new Date().getFullYear()} TaxTim | Human Robot Pty Ltd. All Rights
          Reserved.
        </p>

        <p className="footer-small">
          Supported by SARS Registered Tax Practitioner PR-0009352 | 32 Hout St,
          Gardens, Cape Town, South Africa | Site secured by Amazon Web Services.
        </p>
      </div>
    </footer>
  );
}