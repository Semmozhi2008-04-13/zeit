import { Link } from "react-router-dom";
function Footer() {
  return (
    <footer className="zeit-footer">
      <div className="footer-left">
        <h1 className="footer-logo">Zeit</h1>

        <div className="social-icons">

          <a href="#" aria-label="Instagram">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="18" cy="6" r="1" />
            </svg>
          </a>

          <a href="#" aria-label="Twitter">
            <svg viewBox="0 0 24 24" className="brand-fill">
              <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-7.1L5.8 22H2.7l7.3-8.4L1.5 2h6.4l4.4 6.5L18.9 2Z" />
            </svg>
          </a>

          <a href="#" aria-label="Facebook">
            <svg viewBox="0 0 24 24" className="brand-fill">
              <path d="M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.7 1.8-1.7h1.9V2.5c-.9-.1-1.8-.2-2.7-.2-2.7 0-4.5 1.6-4.5 4.7v2.5H7v3.5h3V22h3.5Z" />
            </svg>
          </a>

          <a href="#" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" className="brand-fill">
              <path d="M5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3.2 9h3.6v12H3.2V9Zm5.8 0h3.4v1.6h.1A3.8 3.8 0 0 1 16 8.7c3.7 0 4.4 2.4 4.4 5.5V21h-3.6v-6c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H9V9Z" />
            </svg>
          </a>

        </div>

        <p className="footer-copyright">
          Copyright © Zeit Limited
        </p>

        <p className="footer-license">
          Lic No. : 1234567890
        </p>
      </div>

      
    <div className="footer-center">
  <Link to="/home">Home</Link>
  <Link to="/cart">Cart</Link>
  <Link to="/profile">My Account</Link>
  <Link to="/support">Customer Support</Link>
  <Link to="/contact">Contact</Link>
</div>

     
      <div className="footer-right">
        <h3>Download App</h3>

        <a href="#" className="app-store-badge">
          <svg viewBox="0 0 24 24" className="store-logo">
            <path fill="#34A853" d="M2 1.5 13.5 12 2 22.5Z" />
            <path fill="#4285F4" d="m2 1.5 14 7.8-2.5 2.7Z" />
            <path fill="#FBBC04" d="m13.5 12 3.5 3.2L2 22.5Z" />
            <path fill="#EA4335" d="m16 9.3 5.2 2.9c1 .5 1 1.1 0 1.7L16 16.8 13.5 12Z" />
          </svg>
          <div>
            <small>GET IT ON</small>
            <strong>Google Play</strong>
          </div>
        </a>

        <a href="#" className="app-store-badge">
          <svg viewBox="0 0 24 24" className="store-logo">
            <path fill="white" d="M16.7 12.8c0-2 1.6-3 1.7-3.1-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.8-2.7-.8-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.4 1 8.5.7 1 1.4 2.1 2.5 2.1 1 0 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7s1.8-1 2.5-2.1c.8-1.2 1.1-2.4 1.1-2.5-.1 0-1.9-.8-1.9-3.5ZM14.6 6.8c.6-.7 1-1.6.9-2.5-.8 0-1.8.5-2.4 1.2-.5.6-1 1.5-.9 2.4.9.1 1.8-.4 2.4-1.1Z" />
          </svg>
          <div>
            <small>Download on the</small>
            <strong>App Store</strong>
          </div>
        </a>
      </div>

    </footer>
  );
}

export default Footer;
