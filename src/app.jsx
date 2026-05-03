import React from 'react';
import ReactDOM from 'react-dom/client';
import SpaRoutes from './SpaRoutes';
import { applyThemeImageVars } from './lib/assets';

applyThemeImageVars();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SpaRoutes />
  </React.StrictMode>,
);
