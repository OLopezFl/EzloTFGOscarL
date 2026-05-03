import './Footer.css';
import { ASSETS } from '../../lib/assets';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const nif = 'B52789431';

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img src={ASSETS.LOGO_B} alt="Ezlo" className="footer-logo" />
        </div>
        <div className="footer-meta">
          <p className="footer-phone">+34 666 666 666</p>
          <p className="footer-nif">NIF: {nif}</p>
          <p className="footer-copy">&copy; {currentYear} Ezlo Limpiezas</p>
        </div>
      </div>
    </footer>
  );
}
