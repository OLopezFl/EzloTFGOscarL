import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../lib/api';
import { ASSETS } from '../../lib/assets';
import { ROUTES } from '../../lib/routes';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const logoSrc = ASSETS.LOGO;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiUrl('/api/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        localStorage.removeItem('ezlo_token');
        setErrorMessage(data.message || 'No se pudo iniciar sesion.');
        return;
      }

      if (!data?.token || !data?.usuario) {
        localStorage.removeItem('ezlo_token');
        setErrorMessage('Respuesta de login invalida. Intentalo de nuevo.');
        return;
      }

      localStorage.setItem('ezlo_token', data.token);
      localStorage.setItem('ezlo_user', JSON.stringify(data.usuario));
      setSuccessMessage(`Bienvenido, ${data.usuario.username}.`);
      navigate(ROUTES.DASHBOARD);
    } catch {
      setErrorMessage('No hay conexion con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src={logoSrc} alt="Ezlo Limpiezas" className="login-logo" />
            <h1>Acceder</h1>
            <p>Entra con tu usuario y contrasena</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {errorMessage && <p className="login-feedback login-feedback-error">{errorMessage}</p>}
            {successMessage && <p className="login-feedback login-feedback-success">{successMessage}</p>}

            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                placeholder="Tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-remember">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Mantener sesión en este dispositivo</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-login" disabled={isSubmitting}>
              {isSubmitting ? 'Accediendo...' : 'Acceder'}
            </button>
          </form>
        </div>
      </div>

      <div className="login-back-link">
        <Link to={ROUTES.HOME}>← Volver al inicio</Link>
      </div>
    </div>
  );
}