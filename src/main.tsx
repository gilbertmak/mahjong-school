import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import './app.js';
import { App } from './App';
import { RulesetProvider } from './state/RulesetContext';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RulesetProvider>
      <App />
    </RulesetProvider>
  </React.StrictMode>,
);

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
