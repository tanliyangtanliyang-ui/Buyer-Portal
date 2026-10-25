import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import RoleShell from './role-switch/RoleShell';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RoleShell buyer={<App />} />
  </StrictMode>
);
