import { Link } from 'react-router-dom';
import { ASSETS } from '../../lib/assets';
import { ROUTES } from '../../lib/routes';
import './Home.css';

export default function Home() {
  const logoSrc = ASSETS.LOGO;

  return (
    <div className="home">
      <section className="hero-section">
        <div className="hero-overlay" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>
                Tu espacio,
                <span> limpio y cuidado</span>
              </h1>
              <p className="hero-lead">
                Nos encargamos de la limpieza de tu casa, oficina o comunidad para que no tengas que preocuparte por nada.
              </p>
              <div className="hero-buttons">
                <Link to={ROUTES.CONTACT} className="btn btn-primary">Pedir presupuesto</Link>
                <Link to={ROUTES.SERVICES} className="btn btn-secondary">Ver servicios</Link>
              </div>
            </div>
            <div className="hero-image">
              <img src={logoSrc} alt="Logo principal" className="hero-main-image" />
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <p className="section-tag">Qué hacemos</p>
          <h2>
            Un solo equipo para todo el mantenimiento
          </h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-media">
                <img src="https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Servicio de limpieza para oficinas y empresas" className="feature-image" loading="lazy" />
              </div>
              <h3>Oficinas y empresas</h3>
              <p>Limpieza regular de puestos, zonas comunes y salas para que el espacio de trabajo esté siempre a punto.</p>
            </div>
            <div className="feature-card">
              <div className="feature-media">
                <img src="https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Servicio de mantenimiento para comunidades" className="feature-image" loading="lazy" />
              </div>
              <h3>Comunidades</h3>
              <p>Cuidamos portales, escaleras, ascensores y accesos con la frecuencia que necesite tu comunidad.</p>
            </div>
            <div className="feature-card">
              <div className="feature-media">
                <img src="https://images.pexels.com/photos/4107108/pexels-photo-4107108.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Servicio de limpiezas especiales" className="feature-image" loading="lazy" />
              </div>
              <h3>Limpiezas especiales</h3>
              <p>Para mudanzas, fin de obra o puestas a punto: limpieza a fondo en momentos concretos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <p className="section-tag">Por qué elegirnos</p>
          <h2 className="stats-title">Trabajo serio, trato cercano</h2>
          <p className="stats-description">Nos gusta hacerlo facil: acordamos un plan claro, cumplimos horarios y revisamos contigo que todo quede como esperas.</p>
        </div>
      </section>

      <section className="trust-section">
        <div className="container">
          <p className="section-tag">Nuestra experiencia</p>
          <h2 className="trust-title">Datos reales de nuestro día a día</h2>
          <p className="trust-description">Llevamos más de 10 años trabajando en Navarra y alrededores, con más de 200 clientes activos y respuesta habitual en menos de 24 horas.</p>
        </div>
      </section>

      <section className="home-cta">
        <div className="container home-cta-inner">
          <h2>Cuéntanos qué necesitas y te proponemos una solución</h2>
          <p>Sin letra pequeña, sin compromiso y con precios claros desde el principio.</p>
          <Link to={ROUTES.CONTACT} className="btn btn-secondary">Solicitar presupuesto</Link>
        </div>
      </section>
    </div>
  );
}
