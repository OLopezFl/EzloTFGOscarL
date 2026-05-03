import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../lib/routes';
import './FAQ.css';

export default function FAQ() {
  const [expandedId, setExpandedId] = useState(null);

  const faqs = [
    {
      id: 1,
      question: '¿Qué servicios de limpieza ofrecen?',
      answer:
        'Trabajamos limpieza de oficinas, comunidades y servicios puntuales como puestas a punto o limpiezas especiales. Nos adaptamos al tipo de espacio y a la frecuencia que necesites.',
    },
    {
      id: 2,
      question: '¿Cuál es el área de cobertura?',
      answer:
        'Trabajamos en Navarra. Si nos escribes, lo normal es responderte en menos de 24 horas para presupuestos o dudas.',
    },
    {
      id: 3,
      question: '¿Puedo personalizar la frecuencia de limpieza?',
      answer:
        'Si. Puedes elegir limpieza diaria, semanal, quincenal o puntual. Lo ajustamos contigo segun uso del espacio y presupuesto.',
    },
    {
      id: 4,
      question: '¿Qué métodos de desinfección utilizan?',
      answer:
        'Usamos productos adecuados para cada superficie y protocolos de desinfección claros. El equipo está formado para aplicarlos con seguridad.',
    },
    {
      id: 5,
      question: '¿Cómo funciona el presupuesto?',
      answer:
        'Es sencillo: revisamos tu espacio, la frecuencia que necesitas y te enviamos una propuesta clara, sin compromiso.',
    },
    {
      id: 6,
      question: '¿Qué garantías ofrecen en su trabajo?',
      answer:
        'Si algo no queda bien, lo revisamos y lo corregimos. Nuestro objetivo es que quedes tranquilo con el resultado.',
    },
    {
      id: 7,
      question: '¿Pueden trabajar fuera de horario?',
      answer: 'Sí, nos adaptamos cuando hace falta: antes de abrir, al cerrar o en franjas concretas.',
    },
    {
      id: 8,
      question: '¿Cuánto tiempo tarda en obtener una respuesta?',
      answer:
        'Normalmente respondemos en menos de 24 horas. Si es urgente, indícalo en el mensaje y priorizamos la respuesta.',
    },
    {
      id: 9,
      question: '¿Qué incluye una limpieza profunda?',
      answer:
        'Suele incluir cristales, baños, suelos, superficies y zonas de detalle con acumulación de suciedad. Siempre cerramos el alcance contigo antes de empezar.',
    },
    {
      id: 10,
      question: '¿Tienen equipo para limpiezas post-obra?',
      answer:
        'Si. Tenemos experiencia en post-obra para retirar polvo y restos, y dejar el espacio listo para entrar.',
    },
  ];

  const toggleFAQ = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="faq">
      <section className="faq-hero">
        <div className="container">
          <div className="faq-hero-content">
            <h1>Preguntas frecuentes</h1>
            <p>Respuestas claras sobre cómo trabajamos</p>
          </div>
        </div>
      </section>

      <section className="faq-intro">
        <div className="container">
          <p className="section-tag">Dudas comunes</p>
          <h2>Lo que mas nos preguntan</h2>
          <p className="faq-lead">
            Aquí tienes respuestas rápidas para decidir con tranquilidad. Si tu caso es distinto, escríbenos y lo vemos contigo.
          </p>
        </div>
      </section>

      <section className="faq-items-section">
        <div className="container">
          <div className="faq-items">
            {faqs.map((faq) => (
              <div 
                key={faq.id} 
                className={`faq-item ${expandedId === faq.id ? 'expanded' : ''}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleFAQ(faq.id)}
                  aria-expanded={expandedId === faq.id}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <span className="faq-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7 8L10 11L13 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span>
                </button>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="faq-cta">
        <div className="container faq-cta-inner">
          <h2>¿Tienes más preguntas?</h2>
          <p>Escríbenos y te respondemos sin rodeos, con una propuesta ajustada a lo que buscas.</p>
          <Link to={ROUTES.CONTACT} className="btn btn-secondary">Contactar ahora</Link>
        </div>
      </section>
    </div>
  );
}
