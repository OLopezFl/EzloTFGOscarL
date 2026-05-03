import { Link } from 'react-router-dom';
import { ROUTES } from '../../lib/routes';
import './ErrorPages.css';

export default function NotFound() {
  return (
    <section className="error-page" aria-labelledby="error-title-404">
      <div className="error-card">
        <p className="error-code">404</p>
        <h1 id="error-title-404">Pagina no encontrada</h1>
        <p className="error-text">
          La ruta que has intentado abrir no existe o ha cambiado.
        </p>
        <div className="error-actions">
          <Link to={ROUTES.HOME} className="error-btn error-btn-primary">Volver al inicio</Link>
          <Link to={ROUTES.CONTACT} className="error-btn error-btn-secondary">Contactar</Link>
        </div>
      </div>
    </section>
  );
}
