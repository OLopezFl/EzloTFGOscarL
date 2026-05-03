import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ASSETS } from '../../lib/assets';
import { HEADER_NAV_LINKS, ROUTES } from '../../lib/routes';
import './Header.css';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const logoSrc = ASSETS.LOGO;

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header className={`header${isScrolled ? ' scrolled' : ''}`}>
      <div className="header-container">
        <div className="logo-section">
          <img src={logoSrc} alt="Ezlo Limpiezas" className="header-logo" />
        </div>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-label="Abrir o cerrar menÃº"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`nav${menuOpen ? ' open' : ''}`}>
          {HEADER_NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={`header-actions${menuOpen ? ' open' : ''}`}>
          <Link to={ROUTES.LOGIN} className="login-link" onClick={() => setMenuOpen(false)}>Acceder</Link>
          <Link to={ROUTES.CONTACT} className="work-cta" onClick={() => setMenuOpen(false)}>Pedir presupuesto</Link>
        </div>
      </div>
    </header>
  );
}