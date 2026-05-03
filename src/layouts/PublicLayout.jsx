import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/public/Header';
import Footer from '../components/public/Footer';

export default function PublicLayout() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('enter');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setDisplayLocation(location);
      setTransitionStage('enter');

      const settleTimer = setTimeout(() => {
        setTransitionStage('idle');
      }, 260);

      return () => {
        clearTimeout(settleTimer);
      };
    }
  }, [location, displayLocation]);

  return (
    <div className="public-layout">
      <Header />
      <main className="public-main">
        <div 
          className={`route-transition route-${transitionStage}`} 
          key={displayLocation.pathname}
        >
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}