import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.tsx';

const container = document.getElementById('root')!;

try {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  container.innerHTML = `<div id="boot-status"><strong>The app failed to start.</strong><pre>${
    error instanceof Error ? error.message : String(error)
  }</pre></div>`;
}
