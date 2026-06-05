import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './app.js';
import { App } from './App';
import { RulesetProvider } from './state/RulesetContext';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <RulesetProvider>
      <App />
    </RulesetProvider>
  </React.StrictMode>,
);
