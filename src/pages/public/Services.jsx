import { Link } from 'react-router-dom';
import { ROUTES } from '../../lib/routes';
import './Services.css';

export default function Services() {
  const services = [
    {
      id: 1,
      image: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Oficinas y empresas',
      description: 'Limpieza de oficinas, despachos y salas para trabajar en un entorno ordenado y agradable.',
    },
    {
      id: 2,
      image: 'https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Mantenimiento de comunidades',
      description: 'Mantenimiento de portales y zonas comunes con una rutina estable y bien organizada.',
    },
    {
      id: 3,
      image: 'https://images.pexels.com/photos/4239032/pexels-photo-4239032.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Servicios personalizados',
      description: 'Adaptamos horarios, frecuencia y tareas a lo que realmente necesitas.',
    },
    {
      id: 4,
      image: 'https://images.pexels.com/photos/4107108/pexels-photo-4107108.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Desinfección especializada',
      description: 'Desinfección con productos adecuados y protocolos claros para cada tipo de espacio.',
    },
    {
      id: 5,
      image: 'https://images.pexels.com/photos/4239139/pexels-photo-4239139.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Servicio de urgencia',
      description: 'Intervenciones rápidas para incidencias, eventos o limpiezas puntuales urgentes.',
    },
    {
      id: 6,
      image: 'https://images.pexels.com/photos/7641859/pexels-photo-7641859.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Asesoramiento',
      description: 'Te orientamos para definir rutinas de limpieza prácticas y sostenibles en el tiempo.',
    },
  ];

  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="services-hero-content container">
          <p className="services-breadcrumb">Servicios de limpieza</p>
          <h1>Servicios pensados para tu día a día</h1>
          <p>Trabajamos con método, continuidad y comunicación directa para que siempre sepas en qué punto estamos.</p>
          <p className="services-trust-copy">Más de 10 años de experiencia y más de 200 clientes en Navarra y alrededores.</p>
        </div>
      </section>

      <section className="services-grid-section">
        <div className="services-grid container">
          {services.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-media">
                <img src={service.image} alt={service.title} className="service-image" loading="lazy" />
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <Link to={ROUTES.CONTACT} className="service-link">Solicitar servicio</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content container">
          <h2>¿Necesitas una propuesta personalizada?</h2>
          <p>Revisamos tu caso y te enviamos una propuesta clara, realista y ajustada a tu presupuesto.</p>
          <Link to={ROUTES.CONTACT} className="services-cta-btn">Solicitar presupuesto</Link>
        </div>
      </section>
    </div>
  );
}
