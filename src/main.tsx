import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import './app.js';

function AppShell() {
  return null;
}

const root = document.getElementById('react-root');

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <AppShell />
    </React.StrictMode>,
  );
}
