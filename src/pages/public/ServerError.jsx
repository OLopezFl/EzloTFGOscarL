import { Link } from 'react-router-dom';
import { ROUTES } from '../../lib/routes';
import './ErrorPages.css';

export default function ServerError() {
  return (
    <section className="error-page" aria-labelledby="error-title-500">
      <div className="error-card">
        <p className="error-code">500</p>
        <h1 id="error-title-500">Error interno</h1>
        <p className="error-text">
          Ha ocurrido un problema inesperado. Prueba de nuevo en unos minutos.
        </p>
        <div className="error-actions">
          <Link to={ROUTES.HOME} className="error-btn error-btn-primary">Ir al inicio</Link>
          <button
            type="button"
            className="error-btn error-btn-secondary"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    </section>
  );
}
