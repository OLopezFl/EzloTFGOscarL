import { useState } from 'react';
import { buildApiUrl } from '../../lib/api';
import './Contact.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    tipo: 'general',
    mensaje: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const messageLines = [
        `Tipo de consulta: ${formData.tipo || 'general'}`,
        formData.telefono.trim() ? `Telefono: ${formData.telefono.trim()}` : '',
        '',
        formData.mensaje.trim(),
      ].filter(Boolean);

      const response = await fetch(buildApiUrl('/api/v1/formularios'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          remitente_nombre: formData.nombre.trim(),
          remitente_email: formData.email.trim(),
          cuerpo_mensaje: messageLines.join('\n').trim(),
          estado: 'Pendiente',
        }),
      });

      if (!response.ok) {
        let errorText = 'No se pudo enviar el formulario.';
        try {
          const data = await response.json();
          if (data?.message) errorText = data.message;
        } catch {
        }
        throw new Error(errorText);
      }

      setSubmitted(true);
      setFormData({ nombre: '', telefono: '', email: '', tipo: 'general', mensaje: '' });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      setSubmitError(error.message || 'No se pudo enviar el formulario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-inner">
          <p className="contact-eyebrow">CONTACTO</p>
          <h1>Hablemos de tu espacio</h1>
          <p>Cuéntanos qué necesitas y te orientamos de forma clara, sin compromiso.</p>
        </div>
      </section>

      <section className="contact-section">
        <div className="contact-layout">
          <form className="contact-form" onSubmit={handleSubmit}>
            {submitted && <div className="success-message">✓ Mensaje enviado. Te contestamos en breve.</div>}
            {submitError && <div className="success-message" style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#9f1239' }}>{submitError}</div>}
            <h2>Pide tu presupuesto</h2>
            <p className="contact-form-lead">Con unos datos básicos podemos enviarte una propuesta ajustada y realista.</p>
            
            <div className="form-group">
              <label htmlFor="nombre">
                <span>Nombre *</span>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  placeholder="Cómo te llamas"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label htmlFor="telefono">
                <span>Teléfono</span>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  placeholder="Tu teléfono"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </label>
              <label htmlFor="email">
                <span>Email *</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label htmlFor="tipo">
              <span>Tipo de consulta</span>
              <select name="tipo" id="tipo" value={formData.tipo} onChange={handleChange}>
                <option value="general">Consulta general</option>
                <option value="presupuesto">Presupuesto</option>
                <option value="servicio">Información de servicio</option>
                <option value="otro">Otro</option>
              </select>
            </label>

            <label htmlFor="mensaje">
              <span>Mensaje *</span>
              <textarea
                id="mensaje"
                name="mensaje"
                rows="5"
                placeholder="Cuéntanos el tipo de espacio y la frecuencia que te interesaría"
                value={formData.mensaje}
                onChange={handleChange}
                required
                minLength="20"
              ></textarea>
            </label>

            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </form>

          <aside className="contact-info">
            <div className="info-card">
              <h3>Qué puedes esperar</h3>
              <p className="info-card-copy">Te damos una propuesta clara, tiempos realistas y precios transparentes desde el primer contacto.</p>
              <ul>
                <li>Respuesta rápida y sin vueltas</li>
                <li>Plan de limpieza adaptado a tu horario</li>
                <li>Seguimiento para que todo quede bien cerrado</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}